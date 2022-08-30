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
    def __init__(self, playSoundEnabled, mediaFiles, mutedDates):
        self.playSoundEnabled: bool = playSoundEnabled
        self.mediaFiles: list = mediaFiles
        self.mutedDates = mutedDates


""" number between 0 to 1 """
#ASSETS_DIR: str = os.path.expanduser("~/assets")
ASSETS_DIR: str = os.path.expanduser(".")


def getMusicPlayingProps(tenId: str) -> MusicPlayingProps:
    if not tenantId:
        return False
    ts = time.time()
    URL = f"https://communityfeeds.blob.core.windows.net/{tenId}/idcard.json?v={ts}"
    # sending get request and saving the response as response object
    log(f"fetching.. {URL} ..")
    try:
        r = requests.get(url=URL)
        # extracting data in json format
        data: dict = r.json()

        playSound: bool = data.get('playSound', False)
        files: list = data.get(
            'files', ["piano1h.mp3", "french-jazz.mp3", "nature3h.mp3", "piano3h.mp3"])
        mutedDates: list = data.get('muteDates', ["2020-01-26", "2020-01-27"])
        props = MusicPlayingProps(playSound, files, mutedDates)
        with open(f"./MusicPlayingProps", 'w') as f:
            dump(props.__dict__, f)
    except:
       with open(f"./MusicPlayingProps", 'r') as f: ## fallback to a file if exists..
           str = f.read()           
           pp = json.loads(str) # MusicPlayingProps(str)
           return MusicPlayingProps(pp.get("playSoundEnabled") , pp.get("mediaFiles"), pp.get("mutedDates"))           
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
                log(f"Downloaded chunk {chunkNumber} for {mediaFile}..")
                f.write(chunk)
            log(f"Downloaded file {mediaFile}")


def downloadMediaFiles(mediaFiles: list) -> list:
    availableMediaFiles = []
    for mediaFileName in mediaFiles:
        fullFilePath: str = f"{ASSETS_DIR}/{str(mediaFileName)}"
        if not os.path.exists(fullFilePath):
            try:
                downloadFileChuncked(mediaFileName)
                availableMediaFiles.append(mediaFileName)
            except:
                print(f'Could not download {mediaFileName}')
        else:
            availableMediaFiles.append(mediaFileName)


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
            shouldPlay = playingEnabled and ((weekday < calendar.FRIDAY or weekday == calendar.SUNDAY) or (
                weekday == calendar.FRIDAY and currentHour < 15) or (weekday == calendar.SATURDAY and currentHour > 21)) and (
                todayDate not in playingProps.mutedDates)
            desiredVolume = 1 if (
                currentHour > 8 and currentHour < 20) else 0.5

            # test
            #desiredVolume = 0.1
            #availableMediaFiles: list = ["music1.mp3", "music2.mp3"]
            availableMediaFiles: list = downloadMediaFiles(playingProps.mediaFiles)

            isPlaying = pygame.mixer.music.get_busy()
            pygame.mixer.music.set_volume(desiredVolume)
            shouldPlay = True
            log(f"Isplaying {isPlaying}  desiredVolume {desiredVolume} shouldPlay {shouldPlay}")

            if not shouldPlay and isPlaying:
                log(f"Stopping music")
                pygame.mixer.music.stop()
            elif shouldPlay and not isPlaying:  # should play while it aint
                randomMediaFileName = random.choice(availableMediaFiles)
                fullFilePath: str = f"{ASSETS_DIR}/{str(randomMediaFileName)}"

                log(f"loading [{fullFilePath}]")
                pygame.mixer.music.load(fullFilePath)
                log(f"Start Playing [{fullFilePath}]")
                pygame.mixer.music.play()
                log(f"Playing [{fullFilePath}]")
            else:
                log(f"Do Nothing..")
        except Exception as e:
            log(f"Error occured! {e}")
        finally:
            sleeptimeSeconds = 10
            time.sleep(sleeptimeSeconds)
            log(f"Sleeping for {sleeptimeSeconds}..")


def log(msg: str):
    now = datetime.datetime.now()
    current_time = now. strftime("%H:%M:%S")
    if debug:
        print(f"{current_time}\t{msg}")


tenantId: str = sys.argv[1]
debug: bool = sys.argv[2]
log(f"Starting.. with tenantId: {tenantId} debug: {debug}")
controlPlayer(tenantId)
