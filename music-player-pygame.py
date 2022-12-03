from distutils.command.config import dump_file
from json import dump, dumps
import json
import os
import sys
import requests
import time
import datetime
import calendar
import random
import pygame


class MusicPlayingProps:
    # def __init__(self, json_def):
    #     self.__dict__ = json.loads(json_def)
    def __init__(self, playSoundEnabled, mediaFiles, mutedDates, muteOnSaturday):
        self.playSoundEnabled: bool = playSoundEnabled
        self.mediaFiles: list = mediaFiles
        self.mutedDates = mutedDates
        self.muteOnSaturday = muteOnSaturday


""" number between 0 to 1 """
ASSETS_DIR: str = os.path.expanduser("~/assets")
#ASSETS_DIR: str = os.path.expanduser(".")


def getMusicPlayingProps(tenId: str) -> MusicPlayingProps:
    if not tenantId:
        return False
    ts = time.time()
    URL = f"https://communityfeeds.blob.core.windows.net/{tenId}/idcard.json?v={ts}"
    # sending get request and saving the response as response object
    log(1, f"fetching.. {URL} ..")
    try:
        r = requests.get(url=URL)
        # extracting data in json format
        data: dict = r.json()

        playSound: bool = data.get('playSound', False)
        muteOnSaturday: bool = data.get('muteOnSaturday', True)
        files: list = data.get(
            'files', ["piano1h.mp3", "french-jazz.mp3", "nature3h.mp3", "piano3h.mp3"])
        mutedDates: list = data.get('muteDates', ["2022-04-05", "2022-04-04"])
        props = MusicPlayingProps(playSound, files, mutedDates, muteOnSaturday)
        with open(f"./MusicPlayingProps", 'w') as f:
            dump(props.__dict__, f)
    except:
        log(3, f"fallback to a file if exists fectching..")
        # fallback to a file if exists..
        with open(f"./MusicPlayingProps", 'r') as f:
            str = f.read()
            pp = json.loads(str)  # MusicPlayingProps(str)
            return MusicPlayingProps(pp.get("playSoundEnabled"), pp.get("mediaFiles"), pp.get("mutedDates"))
    return props


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
                chunkNumber = chunkNumber + 1
                log(1, f"Downloaded chunk {chunkNumber} for {mediaFile}..")
                f.write(chunk)
            log(3, f"Downloaded file {mediaFile}")


def downloadMediaFiles(mediaFiles: list) -> list:
    availableMediaFiles = []
    for mediaFileName in mediaFiles:
        fullFilePath: str = f"{ASSETS_DIR}/{str(mediaFileName)}"
        if not os.path.exists(fullFilePath):
            try:
                downloadFileChuncked(mediaFileName)
                availableMediaFiles.append(mediaFileName)
            except:
                log(4, f'Could not download {mediaFileName}')
        else:
            availableMediaFiles.append(mediaFileName)
    return availableMediaFiles


def controlPlayer(tenId: str):

    pygame.mixer.init()
    while 1:
        try:
            playingProps = getMusicPlayingProps(tenId)
            playingEnabled = playingProps.playSoundEnabled

            # monday is 0 and sunday is 6, friday 4, sat is 5
            weekday = datetime.datetime.today().weekday()
            todayDate = datetime.datetime.today().strftime("%Y-%m-%d")
            currentHour = datetime.datetime.now().hour
            playMusicOnSaturdays = not playingProps.muteOnSaturday
            todayNotSaturday = not isSaturday(weekday, currentHour)

            shouldPlay = playingEnabled and (playMusicOnSaturdays or todayNotSaturday) and (
                todayDate not in playingProps.mutedDates)

            desiredVolume = 1 if (
                currentHour > 7 and currentHour < 21) else 0.8

            # test
            #desiredVolume = 0.1
            #availableMediaFiles: list = ["music1.mp3", "music2.mp3"]
            availableMediaFiles: list = downloadMediaFiles(
                playingProps.mediaFiles)

            isPlaying = pygame.mixer.music.get_busy()
            pygame.mixer.music.set_volume(desiredVolume)
            log(1, f"Isplaying {isPlaying}  desiredVolume {desiredVolume} shouldPlay {shouldPlay}")

            if not shouldPlay and isPlaying:
                log(3, f"Stopping music")
                pygame.mixer.music.stop()
            elif shouldPlay and not isPlaying:  # should play while it aint
                randomMediaFileName = random.choice(availableMediaFiles)
                fullFilePath: str = f"{ASSETS_DIR}/{str(randomMediaFileName)}"

                log(1, f"loading [{fullFilePath}]")
                pygame.mixer.music.load(fullFilePath)
                log(2, f"Start Playing [{fullFilePath}]")
                pygame.mixer.music.play()
                log(2, f"Playing [{fullFilePath}]")
            else:
                log(1, f"Do Nothing..")
        except Exception as e:
            log(5, f"Error occured! {e}")
        finally:
            sleeptimeSeconds = 10
            time.sleep(sleeptimeSeconds)
            log(1, f"Sleeping for {sleeptimeSeconds}..")


def isSaturday(weekday, currentHour):
    return ((weekday < calendar.FRIDAY or weekday == calendar.SUNDAY) or (
        weekday == calendar.FRIDAY and currentHour < 15) or (weekday == calendar.SATURDAY and currentHour > 21))


def log(level: int, msg: str):
    LOGGING_CODE = os.environ.get('LOGGING_CODE')
    COMM_DEVICE_ID = os.environ.get('COMM_DEVICE_ID')
    now = datetime.datetime.now()
    current_time = now. strftime("%H:%M:%S")
    if debug:
        print(
            f"{current_time} [{level}] \t{tenantId}.{COMM_DEVICE_ID} \t{msg}")
    if level > 1:
        URL = f"https://feeds-admin.azurewebsites.net/api/Logging?code={LOGGING_CODE}&errorCode={level}&msg={msg}"
        # sending get request and saving the response as response object
        try:
            requests.get(url=URL)
        except Exception as e:
            print(f"{current_time}\t{tenantId}.{COMM_DEVICE_ID} \t{e}")


tenantId: str = sys.argv[1]
debug: bool = sys.argv[2]
log(3, f"Starting.. with tenantId: {tenantId} debug: {debug}")

controlPlayer(tenantId)
