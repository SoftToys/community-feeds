import os
import sys
import requests
import time
import threading
import datetime
import subprocess
import psutil
import calendar

tenantId: str = sys.argv[1]
debug: bool = sys.argv[2]

""" number between 0 to 1 """
desiredVolume: int = 0
shouldPlay: bool = False
currentVolume: int = 0


def isPlayingMusicActive() -> bool:
    if not tenantId:
        return False
    ts = time.time()
    URL = f"https://communityfeeds.blob.core.windows.net/{tenantId}/idcard.json?v={ts}"
    # sending get request and saving the response as response object
    r = requests.get(url=URL)

    # extracting data in json format
    data: dict = r.json()
    playSound: bool = data['playSound']
    return playSound


def controlPlayer():
        # monday is 0 and sunday is 6, friday 4, sat is 5
    playingEnabled = isPlayingMusicActive()
    weekday = datetime.datetime.today().weekday()
    currentHour = datetime.datetime.now().hour
    shouldPlay = playingEnabled and (
        weekday < calendar.FRIDAY or weekday == calendar.SUNDAY)
        or (weekday == calendar.FRIDAY and currentHour < 15)
        or (weekday == calendar.SATURDAY and currentHour > 21)
    desiredVolume = 100 if (currentHour > 8 and currentHour < 20) else 50
    processRunning = isProcessRunning()
    if processRunning and not shouldPlay:
        log(f"killing process.. [shouldPlay]: {shouldPlay}")
        killProcess()
        pass
    elif not processRunning and shouldPlay:
        log(f"Starting process.. [desiredVolume]: {desiredVolume}")
        runProcess(desiredVolume, "jazz.mp3")
        pass
    if shouldPlay and desiredVolume != currentVolume:
        log(f"volumeSet [desiredVol]: {desiredVolume},[currentVol]: {currentVolume}")
        adjustSound(desiredVolume)
        pass


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


def isProcessRunning()-> bool:
    return "omxplayer" in (p.name() for p in psutil.process_iter())


def killProcess():
    subprocess.run(["pkill", "omxplayer"])
    pass


def runProcess(volume: int, file: str):
    dbl = volumeToDbl(volume)
    fullFilePath = f"~/assets/{file}"
    log(f"running omxplayer with file {fileToPlay}..")
    subprocess.Popen(["omxplayer", "--vol", str(dbl), "--no-osd", fileToPlay])
    currentVolume = volume
    pass


def adjustSound(volume: int):
    killProcess()
    time.sleep(5)
    runProcess(volume)
    pass


# https://config9.com/linux/adjust-audio-volume-level-with-cli-omxplayer-raspberry-pi/ solution 5
# api-endpoint
index = 0
while True:
    controlPlayer()
    time.sleep(60)
    index = index+1
    if index > 2:
        sys.exit(0)
    pass
# threading.Timer(20, controlPlayer).start()  # every 2 minutes
