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
import logging


Log_Format = "%(levelname)s %(asctime)s - %(message)s"

logging.basicConfig(filename="logfile.log",
                    filemode="w",
                    format=Log_Format,
                    level=logging.ERROR)

logger = logging.getLogger()


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
    log(f"downloading file.. {url}")
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
                log(f"Downloaded chunk {chunkNumber} for {mediaFile}..")
                f.write(chunk)
            log(f"Downloaded file {mediaFile}")


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
    log(f"currentVolume is  {currentVolume}")
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
    log(f"shouldPlay :{shouldPlay}, processRunning: {processRunning}, volumeSet [desiredVol]: {desiredVolume},[currentVol]: {currentVolume}")
    if processRunning and not shouldPlay:
        log(f"killing process.. [shouldPlay]: {shouldPlay}")
        killProcess()
        pass
    elif not processRunning and shouldPlay:
        log(f"Starting process.. [desiredVolume]: {desiredVolume}")
        runProcess(desiredVolume, fullFilePath)
        currentVolume = desiredVolume
        pass
    if shouldPlay and desiredVolume != currentVolume:
        log(f"volumeSet [desiredVol]: {desiredVolume},[currentVol]: {currentVolume}")
        adjustSound(desiredVolume, fullFilePath)
        currentVolume = desiredVolume
        pass
    else:
      log(f"DO NOTHING volumeSet [desiredVol]: {desiredVolume},[currentVol]: {currentVolume}")
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


def log(msg: str):
    now = datetime.datetime.now()
    current_time = now. strftime("%H:%M:%S")
    if debug:
        print(f"{current_time}\t{msg}")
    logger.log(1, msg)


def isProcessRunning() -> bool:
    return "omxplayer" in (p.name() for p in psutil.process_iter())


def killProcess():
    subprocess.Popen("pkill omxplayer", shell=True)
    pass


def runProcess(volume: int, fullFilePath: str):
    dbl = volumeToDbl(volume)
    log(f"running omxplayer with file {fullFilePath} volume: {dbl}")
    subprocess.Popen(
        f"omxplayer {fullFilePath} --vol {dbl} --no-osd --loop", shell=True)
    pass


def adjustSound(volume: int, fullFilePath: str):
    killProcess()
    time.sleep(5)
    runProcess(volume, fullFilePath)
    pass


tenantId: str = sys.argv[1]
debug: bool = sys.argv[2]

controlPlayer(tenantId)

# # https://config9.com/linux/adjust-audio-volume-level-with-cli-omxplayer-raspberry-pi/ solution 5
# # api-endpoint
# index = 0
# while True:
#     controlPlayer()
#     time.sleep(60)
#     pass
# # threading.Timer(20, controlPlayer).start()  # every 2 minutes
