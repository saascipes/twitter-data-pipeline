import sys
import os
import requests
import json
import gzip
import shutil
import time
import json


token = ''

if len(sys.argv) < 4:
    print('Usage: python download_sg_agent.py [accessKeyId] "[accessKeySecret]" [platform] [architecture]')
    sys.exit()

teamId = ''
accessKeyId = sys.argv[1]
accessKeySecret = sys.argv[2]
platform = sys.argv[3]
arch = None
if len(sys.argv) > 4:
    arch = sys.argv[4]


def RestAPILogin():
    global token
    global teamId
    global accessKeyId
    global accessKeySecret

    url = 'https://console.saasglue.com/login/apilogin'
    
    headers = {
        'Content-Type': 'application/json'
    }

    data = {
        'accessKeyId': accessKeyId,
        'accessKeySecret': accessKeySecret
    }

    res = requests.post(url=url, headers=headers, data=json.dumps(data))
    if (res.status_code != 200):
        raise Exception(
            'Call to {} returned {} - {}'.format(url, res.status_code, res.text))

    token = json.loads(res.text)['config1']
    teamId = json.loads(res.text)['config3']


def GetDownloadUrl():
    global token
    global teamId
    global platform
    global arch

    while token == '':
        RestAPILogin()
        if token == '':
            print('API login failed')
            time.sleep(5)
            print('Retrying api login')
    
    print('token = ', token)

    url = 'https://console.saasglue.com/api/v0/agentDownload/agentstub/{}'.format(platform)
    if arch:
        url += ('/' + arch)

    headers = {
    	'Cookie': 'Auth={};'.format(token),
        '_teamId': teamId
    }

    print('headers = ', headers)

    while True:
        res = requests.get(url=url, headers=headers)

        print('res1 = ', res.json())
        print('res2 = ', res.json()['data'])
        if (res.status_code == 200):
            break
        else:
            if (res.status_code == 303):
                time.sleep(10)
            else:
                raise Exception(
                    'Call to {} returned {} - {}'.format(url, res.status_code, res.text))

    return res.json()['data']


def DownloadAgent():
    global platform

    s3url = GetDownloadUrl()

    res = requests.get(s3url, allow_redirects=True)

    compressedFile = ''
    outFile = ''
    if platform.lower()[:3] == 'win':
        compressedFile = './sg-agent-launcher.zip'
        outFile = './sg-agent-launcher.exe'
        open(compressedFile, 'wb').write(res.content)
    else:
        compressedFile = './sg-agent-launcher.gz'
        outFile = './sg-agent-launcher'
        open(compressedFile, 'wb').write(res.content)

        with gzip.open(compressedFile, 'rb') as f_in:
            with open(outFile, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)

        os.chmod(outFile, 0o777)

        os.remove('sg-agent-launcher.gz')



DownloadAgent()

# cmd = """
# echo | crontab
# (crontab -l ; echo "*/1 * * * * /usr/bin/flock -n ./sg_agent_launcher.lockfile {}") | crontab -
# """.format(outFile)

# os.system(cmd)
