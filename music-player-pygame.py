import json
import os
import sys
import requests
import time
import datetime
import calendar
import random
import pygame
import uuid
import glob
import subprocess
import urllib.parse


heartbit_interval_minutes = 1
heartbit_interval_seconds = heartbit_interval_minutes * 60


class MusicPlayingProps:
    def __init__(self, playSoundEnabled, mediaFiles, mutedDates, muteOnSaturday):
        self.playSoundEnabled: bool = playSoundEnabled
        self.mediaFiles: list = mediaFiles
        self.mutedDates = mutedDates
        self.muteOnSaturday = muteOnSaturday

ASSETS_DIR: str = os.path.expanduser("~/assets")
DEFAULT_MUSIC = ["piano1h.mp3", "french-jazz.mp3", "nature3h.mp3", "piano3h.mp3"]

def get_mac_address():
    """Returns the MAC address of the device as a unique identifier."""
    try:
        mac = ':'.join(['{:02x}'.format((uuid.getnode() >> i) & 0xff) for i in range(0, 48, 8)])
        return mac
    except Exception as e:
        log(5, f"Failed to get MAC address: {e}")
        return "Unknown_MAC"

def get_crontab():
    """Retrieve the current crontab configuration safely."""
    try:
        result = subprocess.run(["crontab", "-l"], capture_output=True, text=True)
        
        if result.returncode == 0:
            return result.stdout.strip() if result.stdout.strip() else "No crontab entries found"
        else:
            return "Crontab not accessible"
    
    except Exception as e:
        log(5, f"Error retrieving crontab: {e}")
        return "Crontab retrieval failed"


def get_hdmi_status():
    """Check HDMI connections, active presentation, and source correctness."""
    hdmi_statuses = []
    try:
        hdmi_devices = glob.glob("/sys/class/drm/card*-HDMI-A-*")

        for hdmi_device in hdmi_devices:
            port_name = hdmi_device.split("/")[-1]
            status_path = os.path.join(hdmi_device, "status")
            enabled_path = os.path.join(hdmi_device, "enabled")
            mode_path = os.path.join(hdmi_device, "mode")

            connected = False
            active_presentation = False
            resolution = "Unknown"

            if os.path.exists(status_path):
                with open(status_path, 'r') as f:
                    connected = f.read().strip() == "connected"

            if connected and os.path.exists(enabled_path):
                with open(enabled_path, 'r') as f:
                    active_presentation = f.read().strip() == "enabled"

            if connected and os.path.exists(mode_path):
                with open(mode_path, 'r') as f:
                    resolution = f.read().strip()

            hdmi_statuses.append({
                "Port": port_name,
                "Connected": connected,
                "Active Presentation": active_presentation,
                "Resolution": resolution
            })
    except Exception as e:
        log(5, f"Failed to get HDMI status: {e}")
        hdmi_statuses.append({"Error": str(e)})

    return hdmi_statuses

def getMusicPlayingProps(tenId: str) -> MusicPlayingProps:
    if not tenId:
        return False
    ts = time.time()
    URL = f"https://communityfeeds.blob.core.windows.net/{tenId}/idcard.json?v={ts}"
    log(1, f"Fetching {URL}")
    try:
        r = requests.get(url=URL)
        data: dict = r.json()

        playSound: bool = data.get('playSound', False)
        muteOnSaturday: bool = data.get('muteOnSaturday', True)
        files: list = data.get('mediaFiles', DEFAULT_MUSIC)
        mutedDates: list = data.get('muteDates', ["2022-04-05", "2022-04-04"])
        props = MusicPlayingProps(playSound, files, mutedDates, muteOnSaturday)
        
        with open(f"./MusicPlayingProps", 'w') as f:
            json.dump(props.__dict__, f)
    except:
        log(3, f"Fallback to file if exists")
        with open(f"./MusicPlayingProps", 'r') as f:
            str = f.read()
            pp = json.loads(str)
            return MusicPlayingProps(pp.get("playSoundEnabled"), pp.get("mediaFiles"), pp.get("mutedDates"), pp.get("muteOnSaturday"))
    return props

def downloadMediaFiles(mediaFiles: list, tenId: str) -> list:
    availableMediaFiles = []
    for mediaFileName in mediaFiles:
        fullFilePath: str = f"{ASSETS_DIR}/{str(mediaFileName)}"
        if not os.path.exists(fullFilePath):
            try:
                url = f'https://communityfeeds.blob.core.windows.net/assets/{mediaFileName}'
                if mediaFileName not in DEFAULT_MUSIC:
                    url = f'https://communityfeeds.blob.core.windows.net/{tenId}/assets/{mediaFileName}'
                
                if not os.path.exists(ASSETS_DIR):
                    os.mkdir(ASSETS_DIR)
                
                with requests.get(url, stream=True) as r:
                    r.raise_for_status()
                    with open(fullFilePath, 'wb') as f:
                        for chunk in r.iter_content(chunk_size=8192):
                            f.write(chunk)
                    log(3, f"Downloaded {mediaFileName}")
                
                availableMediaFiles.append(mediaFileName)
            except:
                log(4, f'Could not download {mediaFileName}')
        else:
            availableMediaFiles.append(mediaFileName)
    return availableMediaFiles

def controlPlayer(tenId: str):
    pygame.mixer.init()
    last_heartbeat_time = time.time()

    # Print heartbeat message when the script starts
    hdmi_statuses = get_hdmi_status()
    crontab = get_crontab()
    log(3, f"HEARTBEAT (Startup) -  HDMI Status: {hdmi_statuses} , crontab : {crontab}")

    while True:
        try:
            playingProps = getMusicPlayingProps(tenId)
            playingEnabled = playingProps.playSoundEnabled

            weekday = datetime.datetime.today().weekday()
            todayDate = datetime.datetime.today().strftime("%Y-%m-%d")
            currentHour = datetime.datetime.now().hour
            playMusicOnSaturdays = not playingProps.muteOnSaturday
            todayNotSaturday = not isSaturday(weekday, currentHour)

            shouldPlay = playingEnabled and (playMusicOnSaturdays or todayNotSaturday) and (todayDate not in playingProps.mutedDates)

            desiredVolume = 1 if (currentHour > 8 and currentHour < 20) else 0.8
            availableMediaFiles: list = downloadMediaFiles(playingProps.mediaFiles, tenId)

            isPlaying = pygame.mixer.music.get_busy()
            pygame.mixer.music.set_volume(desiredVolume)

            log(1, f"IsPlaying: {isPlaying} , Volume: {desiredVolume} , ShouldPlay: {shouldPlay}")

            if not shouldPlay and isPlaying:
                log(3, f"Stopping music")
                pygame.mixer.music.stop()
            elif shouldPlay and not isPlaying:
                randomMediaFileName = random.choice(availableMediaFiles)
                fullFilePath: str = f"{ASSETS_DIR}/{str(randomMediaFileName)}"

                log(1, f"Loading [{fullFilePath}]")
                pygame.mixer.music.load(fullFilePath)
                log(2, f"Start Playing [{fullFilePath}]")
                pygame.mixer.music.play()
                log(2, f"Started Playing [{fullFilePath}]")

            if time.time() - last_heartbeat_time >= heartbit_interval_seconds:
                logHeartBit(isPlaying)
                last_heartbeat_time = time.time()


        except Exception as e:
            log(5, f"Error occurred: {e}")
        finally:
            time.sleep(30)
            log(1, "Sleeping for 30 seconds...")

def logHeartBit(isPlaying):
    hdmi_statuses = get_hdmi_status()
    log(2, f"HEARTBEAT - HDMI Status: {hdmi_statuses} ,isPlaying: {isPlaying} ")

def isSaturday(weekday, currentHour):
    return (weekday == calendar.FRIDAY and currentHour > 15) or (weekday == calendar.SATURDAY and currentHour < 21)

failed_logs = []  # Store failed logs

MAX_FAILED_LOGS = 100  # Define the max number of logs to retain

def log(level: int, msg: str):
    global failed_logs
    LOGGING_CODE = os.environ.get('MUSIC_PLAYER_LOGGING_CODE', "qJHyTpTzYiHuaMLluvnO/i0XyGVPar7bbi9gDa4DraQYxFZkw2jo2w==")
    COMM_DEVICE_ID = os.environ.get('COMM_DEVICE_ID', get_mac_address())
    tenantId: str = sys.argv[1]

    now = datetime.datetime.now()
    local_time = now.strftime("%Y-%m-%d %H:%M:%S")

    msg = f"(MusicPlayerLogs) TenantID: {tenantId} | DeviceID: {COMM_DEVICE_ID} | Device Time: {local_time} | {msg}"
    encoded_msg = urllib.parse.quote(msg)  # Encoding the message safely for URL

    print(msg)

    # Retry previously failed logs first
    if failed_logs:
        print("Retrying previously failed logs...")
        for log_entry in failed_logs[:]:  # Iterate over a copy to remove items safely
            try:
                encoded_old_msg = urllib.parse.quote(log_entry[1])  # Encode previous log messages
                requests.get(f"https://community-feeds-admin-api.azurewebsites.net/api/log?code={LOGGING_CODE}&errorCode={log_entry[0]}&msg={encoded_old_msg}&tenant={tenantId}")
                failed_logs.remove(log_entry)  # Remove if successfully sent
            except requests.RequestException:
                print("Failed again, keeping in retry queue.")

    # Send the current log entry
    if level > 1:
        try:
            requests.get(f"https://community-feeds-admin-api.azurewebsites.net/api/log?code={LOGGING_CODE}&errorCode={level}&msg={encoded_msg}&tenant={tenantId}")
        except requests.RequestException:
            print("Logging failed, storing for retry.")
            failed_logs.append((level, msg))  # Store failed logs for later retry

            # Ensure failed_logs doesn't exceed MAX_FAILED_LOGS
            if len(failed_logs) > MAX_FAILED_LOGS:
                failed_logs.pop(0)  # Remove the oldest log entry


tenantId: str = sys.argv[1]
debug: bool = sys.argv[2]
log(3, "Starting player...")

controlPlayer(tenantId)
