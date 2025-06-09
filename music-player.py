import os
import sys
import requests
import time
import threading
import datetime
import subprocess
import psutil
import calendar
import random
import uuid
import urllib.parse


version = "0.02"


CRON_VERSION = "v0.02"  # Update this when you change the cron jobs
CRON_MARKER = f"# MusicPlayer version {CRON_VERSION}"
CRON_JOBS = f"""
*/10 * * * * python3 ~/assets/rebootOnNoConnection.py ariklavi5-725fxx4zse True
*/15 * * * * curl --head https://communityfeeds.blob.core.windows.net/scripts/music-player-pygame.py && wget -N --tries=5 https://communityfeeds.blob.core.windows.net/scripts/music-player-pygame.py -O ~/assets/music-player-pygame.py
7 */1 * * * curl --head https://communityfeeds.blob.core.windows.net/scripts/rebootOnNoConnection.py && wget -N --tries=5 https://communityfeeds.blob.core.windows.net/scripts/rebootOnNoConnection.py -O ~/assets/rebootOnNoConnection.py
0 */4 * * * sudo reboot
@reboot python3 ~/assets/music-player-pygame.py ariklavi5-725fxx4zse True
"""

def update_crontab():
    try:
        # Get the current crontab
        result = subprocess.run(["crontab", "-l"], capture_output=True, text=True)
        current_cron = result.stdout if result.returncode == 0 else ""

        # Check if the version marker exists
        if CRON_MARKER in current_cron:
            log(1, "Crontab is up to date. No changes made.")
            return

        # Update crontab with new version
        new_cron_content = f"{CRON_MARKER}\n{CRON_JOBS}"
        subprocess.run(["crontab", "-"], input=new_cron_content, text=True)
        log(3,"Crontab updated successfully.")

    except Exception as e:
        log(3, f"Error updating crontab: {e}")



class MusicPlayingProps:
    def __init__(self, playSoundEnabled, mediaFiles, mutedDates):
        self.playSoundEnabled: bool = playSoundEnabled
        self.mediaFiles: list = mediaFiles
        self.mutedDates = mutedDates


""" number between 0 to 1 """
DESIRED_VOLUME_ENV_NAME: str = 'COMMUN_DESIRED_VOLUME'
ASSETS_DIR: str = os.path.expanduser("~/assets")
CURRENT_VOL_FILE_NAME = f"{ASSETS_DIR}/vol.txt"


def isPlayingMusicActive(tenId: str) -> MusicPlayingProps:
    if not tenantId:
        return False
    ts = time.time()
    URL = f"https://communityfeeds.blob.core.windows.net/{tenId}/idcard.json?v={ts}"
    # sending get request and saving the response as response object
    r = requests.get(url=URL)

    # extracting data in json format
    data: dict = r.json()
    playSound: bool = data.get('playSound', False)
    files: list = data.get(
        'files', ["piano1h.mp3", "french-jazz.mp3", "nature3h.mp3", "piano3h.mp3"])
    mutedDates: list = data.get('muteDates', ["2020-01-26", "2020-01-27"])
    return MusicPlayingProps(playSound, files, mutedDates)


def downloadFile(mediaFile: str):
    url = f'https://communityfeeds.blob.core.windows.net/assets/{mediaFile}'
    log(2, f"downloading file.. {url}")
    r = requests.get(url, allow_redirects=True)
    if not os.path.exists(ASSETS_DIR):
        os.mkdir(ASSETS_DIR)
    f = open(f"{ASSETS_DIR}/{mediaFile}", 'wb')
    f.write(r.content)
    f.close()


def downloadFileChuncked(mediaFile: str):
    url = f'https://communityfeeds.blob.core.windows.net/assets/{mediaFile}'
    # NOTE the stream=True parameter below
    if not os.path.exists(ASSETS_DIR):
        os.mkdir(ASSETS_DIR)
    chunkNumber = 0
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open(f"{ASSETS_DIR}/{mediaFile}", 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                # If you have chunk encoded response uncomment if
                # and set chunk_size parameter to None.
                # if chunk:
                chunkNumber = chunkNumber + 1
                log(1,f"Downloaded chunk {chunkNumber} for {mediaFile}..")
                f.write(chunk)
            log(2,f"Downloaded file {mediaFile}")


def setCurrentVol(vol: int):
    f = open(CURRENT_VOL_FILE_NAME, "w")
    f.write(str(vol))
    f.close()


def getCurrentVol():
    if not os.path.exists(CURRENT_VOL_FILE_NAME):
        return 0
    f = open(CURRENT_VOL_FILE_NAME, "r")
    content = f.read()
    f.close()
    return int(content)


def controlPlayer(tenId: str):

    desiredVolume: int = 0
    currentVolume: int = getCurrentVol()
    log(1, f"currentVolume is  {currentVolume}")
    # monday is 0 and sunday is 6, friday 4, sat is 5
    playingProps = isPlayingMusicActive(tenId)
    playingEnabled = playingProps.playSoundEnabled

    weekday = datetime.datetime.today().weekday()
    todayDate = datetime.datetime.today().strftime("%Y-%m-%d")
    currentHour = datetime.datetime.now().hour
    shouldPlay = playingEnabled and ((weekday < calendar.FRIDAY or weekday == calendar.SUNDAY) or (
        weekday == calendar.FRIDAY and currentHour < 15) or (weekday == calendar.SATURDAY and currentHour > 21)) and (
        todayDate not in playingProps.mutedDates)
    desiredVolume = 100 if (currentHour > 8 and currentHour < 20) else 50
    processRunning = isProcessRunning()

    availableMediaFiles: list = []

    for mediaFileName in playingProps.mediaFiles:
        fullFilePath: str = f"{ASSETS_DIR}/{str(mediaFileName)}"
        if shouldPlay and not os.path.exists(fullFilePath):
            try:
                downloadFileChuncked(mediaFileName)
                availableMediaFiles.append(mediaFileName)
            except:
                print(f'Could not download {mediaFileName}')
        else:
            availableMediaFiles.append(mediaFileName)

    randomMediaFileName = random.choice(availableMediaFiles)
    fullFilePath: str = f"{ASSETS_DIR}/{str(randomMediaFileName)}"
    log(1,
        f"shouldPlay :{shouldPlay}, processRunning: {processRunning}, volumeSet [desiredVol]: {desiredVolume},[currentVol]: {currentVolume}")
    if processRunning and not shouldPlay:
        log(1, f"killing process.. [shouldPlay]: {shouldPlay}")
        killProcess()
        pass
    elif not processRunning and shouldPlay:
        log(1, f"Starting process.. [desiredVolume]: {desiredVolume}")
        runProcess(desiredVolume, fullFilePath)
        currentVolume = desiredVolume
        pass
    if shouldPlay and desiredVolume != currentVolume:
        log(1, f"volumeSet [desiredVol]: {desiredVolume},[currentVol]: {currentVolume}")
        adjustSound(desiredVolume, fullFilePath)
        currentVolume = desiredVolume
        pass
    else:
        log(1, 
            f"No need to adjust volume ,volumeSet [desiredVol]: {desiredVolume},[currentVol]: {currentVolume}")
    setCurrentVol(currentVolume)


def volumeToDbl(volumePercentage: int):
    if volumePercentage < 30:
        return -1000
    if volumePercentage < 60:
        return -600
    if volumePercentage < 90:
        return 0
    else:
        return 200
DEVICE_DETAILS_FILE_PATH = "device_id.txt"  # Ensure this path is defined

def get_device_id():
    """Retrieve and cache MAC address in a persistent file."""
    
    # Check if we have env variable
    deviceIdFromEnvironment = os.environ.get('COMM_DEVICE_ID')
    if deviceIdFromEnvironment:  # This ensures it's neither None nor empty
        return deviceIdFromEnvironment
    
    # Check if the MAC address is already cached in a file
    if os.path.exists(DEVICE_DETAILS_FILE_PATH):
        with open(DEVICE_DETAILS_FILE_PATH, "r") as f:
            return f.read().strip()
    
    # Retrieve the MAC address and store it
    try:
        mac = ':'.join(['{:02x}'.format((uuid.getnode() >> i) & 0xff) for i in range(0, 48, 8)])
        with open(DEVICE_DETAILS_FILE_PATH, "w") as f:
            f.write(mac)
        os.environ["COMM_DEVICE_ID"] = mac  # Store in env variable for runtime efficiency
        return mac
    except Exception as e:
        print(f"Error retrieving MAC address: {e}")
        return "Unknown_MAC"

MAX_FAILED_LOGS = 50
failed_logs = []

def log(level: int, msg: str):
    global failed_logs
    LOGGING_CODE = os.environ.get('MUSIC_PLAYER_LOGGING_CODE', "qJHyTpTzYiHuaMLluvnO/i0XyGVPar7bbi9gDa4DraQYxFZkw2jo2w==")
    COMM_DEVICE_ID = get_device_id()    

    tenantId: str = sys.argv[1]

    now = datetime.datetime.now()
    local_time = now.strftime("%Y-%m-%d %H:%M:%S")

    msg = f"(MusicPlayerLogs {version}) TenantID: {tenantId} | DeviceID: {COMM_DEVICE_ID} | Device Time: {local_time} | {msg}"
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


def isProcessRunning() -> bool:
    try:
        return "omxplayer" in (p.name() for p in psutil.process_iter())
    except Exception as e:
        log(3, e)



def killProcess():
    subprocess.Popen("pkill omxplayer", shell=True)
    pass


def runProcess(volume: int, fullFilePath: str):
    try:
        dbl = volumeToDbl(volume)
        log(2, f"running omxplayer with file {fullFilePath} volume: {dbl}")
        subprocess.Popen(
            f"omxplayer {fullFilePath} --vol {dbl} --no-osd --loop", shell=True)
        pass
    except Exception as e:
        log(3, e)

def adjustSound(volume: int, fullFilePath: str):
    killProcess()
    time.sleep(5)
    runProcess(volume, fullFilePath)
    pass


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


tenantId: str = sys.argv[1]
debug: bool = sys.argv[2]
log(3, f"Starting.. with tenantId: {tenantId} debug: {debug}")
update_crontab()

crontab = get_crontab()
log(3, f"HEARTBEAT (Startup) -  crontab : {crontab}")

controlPlayer(tenantId)

# # https://config9.com/linux/adjust-audio-volume-level-with-cli-omxplayer-raspberry-pi/ solution 5
# # api-endpoint
# index = 0
# while True:
#     controlPlayer()
#     time.sleep(60)
#     pass
# # threading.Timer(20, controlPlayer).start()  # every 2 minutes
