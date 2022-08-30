import os
import sys
import requests
import time
import datetime


def hasConnection(tenId: str) -> bool:
    if not tenId:
        return False
    ts = time.time()
    URL = f"https://communityfeeds.blob.core.windows.net/{tenId}/idcard.json?v={ts}"
    try:
        # sending get request and saving the response as response object
        r = requests.get(url=URL)
        return r.ok
    except:
        return False


NUMBER_OF_RETRIES = 8
SLEEP_BETWEEN_RETRIES_SEC = 20


def checkConnection(tenId: str) -> bool:
    for r in range(NUMBER_OF_RETRIES):
        log(f"Waiting {SLEEP_BETWEEN_RETRIES_SEC} Seconds before Checking Internet Connection on retry {r} !")
        time.sleep(SLEEP_BETWEEN_RETRIES_SEC)
        if (not hasConnection(tenId)):
            log(f"NO Internet Connection on retry {r}!")
        else:
            log(f"Success! Found Internet Connection on retry {r} !")
            return True
    return False


def rebootOnNoConnection(tenId: str):
    if (not checkConnection(tenId)):
        log(f"NO Internet Connection! .. rebooting")
        os.system("sudo reboot")


def log(msg: str):
    now = datetime.datetime.now()
    current_time = now. strftime("%H:%M:%S")
    if debug:
        print(f"{current_time}\t{msg}")


tenantId: str = sys.argv[1]
debug: bool = sys.argv[2]
log(f"Starting.. with tenantId: {tenantId} debug: {debug}")
rebootOnNoConnection(tenantId)
