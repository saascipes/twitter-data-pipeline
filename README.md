# SaaSGlue Twitter Stream Data Pipeline
### This repo includes the software components and configuration files required to:
1. Create a data pipeline that will collect tweets based on a filter and periodically extract the main topics from a moving window of collected tweets
2. Analyze tweets using lemmitization and LDA natural language processing data science techniques in Spark Scala
2. Display the trending topics in a single page web application utilizing vue js and browser push technology
3. Allow a user to change the tweets filter using the web app

## Prerequisites
1. SaaSGlue account - click [here](https://console.saasglue.com) to create an account
2. AWS S3 - read/write access to an S3 bucket via an access key id/secret
3. RabbitMQ - must have the stomp protocol enabled and be publicly accessible
4. Twitter developer account and a bearer token for streaming tweets access
5. Installed software components (on your dev machine)
    - node version 10
    - npm current version
    - typescript
    - Docker for Desktop
    - git command line tools
    - java 8 sdk
    - sbt (scala build tool)

## Install
1. Clone the twitter-data-pipeline repo
    ```
    $ git clone --depth 1 https://github.com/saascipes/twitter-data-pipeline.git
    ```
2. Compile app components
    - Change directories to the twitter-data-pipeline folder
    - Compile with npm i
    ```
    $ npm i
    ```
3. Import and configure SaaSGlue jobs
    1. Log in to the SaaSGlue web console
        - Log in to the SaasGlue web [console](https://console.saasglue.com) - if you don't have an account yet, sign up for a free account
        - Click your name in the upper right corner and click "settings" - note your "Team ID" - you'll need this later
    2. Import SaaSGlue artifacts
        - This will import the "Tweet Stream Analyzer" job and the associated tasks, steps and scripts into your SaaSGlue team workspace.
            - Tasks
                - Stream tweets (lambda) - this task will stream tweets up to a maximum number of tweets or a timeout, whichever comes first. The task will run in a SaaSGlue provisioned AWS account as a lambda function.
                - Analyze tweets - this task will analyze the tweets, extract the major topics and publish them to a message queue
                    - delete old tweets - this step will remove tweets older than a specified number of milliseconds or all prior tweets depending on the job configuration
                    - download tweets file - will download the tweet file generated by the prior task to the spark master node
                    - run tweet analysis - will run a scala spark job that will lemmatize the captured tweets and use the LDA natural language processing model to extract the major topics
                    - publish topics - will publish the extracted topics to a message queue from which they will be consumed by the web application
        - Click "Designer" in the menu bar
        - Click "Import Jobs"
        - Click "Choose File"
        - Select the "twitter_data_pipeline.sgj" file in the spa-build-pipeline root folder and click "Open"
    3. Configure SaaSGlue runtime variables
        - Configure runtime variables - perform the following steps for the two jobs
            - Click "Designer" in the menu bar
            - Click the job named "Tweet Stream Analyzer"
            - Click the "Runtime Variables" tab 
            - Enter the following key/value pairs - if there is an existing runtime variable with the given key, click "unmask" and enter the new value in the input box and hit "enter" - otherwise enter the key/value pair in the input boxes at the bottom of the grid and then click "Add Runtime Variable"

                    oldTweetsCutoffMS = [tweets older than this number of ms will be deleted when new tweets are captured, e.g. 300000]
                    localFilePath = /opt/spark-data/tweets/
                    rmqUrl = [the url of your rabbitmq server, e.g. "my-server.rmq.cloudamqp.com"]
                    rmqUser = [your rabbitmq username]
                    rmqPassword = [your rabbitmq password]
                    MAX_TWEETS = [the max number of tweets to capture, e.g. 1000]
                    TWEETS_UPLOAD_BUCKET = sg-files-share
                    TWEETS_UPLOAD_PREFIX = tweet-streamer
                    TWITTER_BEARER_TOKEN = [your twitter api bearer token]
                    TIMEOUT = [the max amount of time in ms to collect streaming tweets, e.g. 10000]
                    s3Bucket = [the name of the s3 bucket where tweet files will be stored]
                    AWS_ACCESS_KEY_ID = [the aws access key id with s3 read/write access to the s3 bucket where tweet files will be stored]
                    AWS_SECRET_ACCESS_KEY = [the associated aws secret access key]
                    
    4. Note the job id from the Settings tab in the job Designer view - it's labled "Id"
4. Create SaaSGlue access keys
    1. Create Agent access key
        - Log in to the SaasGlue web [console](https://console.saasglue.com)
        - Click your login name in the upper right hand corner and click "Access Keys"
        - Click the "Agent Access Keys" tab
        - Click "Create Agent Access Key"
        - Enter a description, e.g. "default"
        - Click "Create Access Key"
        - Copy the access key secret
        - Click the "I have copied the secret" button
        - Copy the access key id from the grid
    2. Create API access key
        - Log in to the [SaasGlue web console](https://console.saasglue.com)
        - Click your login name in the upper right hand corner and click "Access Keys"
        - Click the "User Access Keys" tab
        - Click "Create User Access Key"
        - Enter a description, e.g. "Twitter data pipeline"
        - Click "Select None"
        - Click the checkboxes next to "JOB_CREATE", "SCHEDULE_READ" and "SCHEDULE_WRITE"
        - Click "Create Access Key"
        - Copy the access key secret
        - Click the "I have copied the secret" button
        - Copy the access key id from the grid
5. Set values in config
    - Open config/default.json and set the following values:
        - "saasGlueApiSecretKey": the value is the API access key secret from step 4.2
        - "saasGlueApiKeyId": the value is the API access key id from step 4.2
        - "tweetsAnalyzerJobDefId": the tweet analyzer job id (either Tweet Stream Analyzer or Tweet Stream Analyzer Local) from step 3.4
        - "saasGlueTeamId": your SaaSGlue team id from step 3.1

    - Open spark-lda/deploy/docker/spark-master/sg.cfg and set the following values:
        - "SG_ACCESS_KEY_ID": this is your agent access key id from step 4.1
        - "SG_ACCESS_KEY_SECRET": this is your agent access key secret from step 4.1
6. Create vue config file
    - Create a new file called ".env.development" in the "clientv1/" directory
    - Add the following key/value pairs to this file:
    ```
    VUE_APP_RABBITMQ_URL=wss://@[your rabbitmq server]/ws/stomp
    VUE_APP_RABBITMQ_USER=[your rabbitmq user name]
    VUE_APP_RABBITMQ_PASS=[your rabbitmq password]
    VUE_APP_RABBITMQ_VHOST=[your rabbitmq vhost]
    VUE_APP_RABBITMQ_QUEUE=bp
    VUE_APP_TWITTER_BEARER_TOKEN=[your twitter api bearer token]
    ```
7. Build docker images for running a local spark cluster
    - Open a terminal window
    - Change directories to the "spark-lda" directory
    ```
    $ cd spark-lda
    ```
    - Run the build-images.sh script
    ```
    $ ./build-images.sh
    ```

## Run the application components
### These instructions are for running the "trending on twitter" web application in your local dev environment
1. Start spark cluster
    - Open a terminal window and change directories to the "spark-lda" directory
    - Start the spark containers - this will create 3 workers - you can change the number of workers by changing the scale parameter
    ```
    $ docker-compose up -d --scale spark-worker=3
    ```
    - After a minute or so you should now see a new agent in the SaaSGlue web console with tags "role=spark-master"
    - To connect to a bash shell in the spark master node (for troubleshooting):
    ```
    $ docker exec -it spark-lda_spark-master_1 /bin/bash
    ```
2. Start the api
    - Open a terminal window and change directories to the twitter data pipeline root folder
    - Run
    ```
    $ npm start serve
    ```
    - You should shortly see the following message:
    ```
    $ API listening on port 3000!
    ```
3. Start the web client application
    - Open a terminal window and change directories to the "clientv1" directory
    - Run
    ```
    $ npm run serve
    ```
    - You should shortly see the following message:
    ```
    Version: typescript 3.7.5
    Time: 3931ms

    App running at:
    - Local:   http://localhost:8080/ 
    - Network: http://xxx.xxx.xxx.xxx:8080/

    Note that the development build is not optimized.
    To create a production build, run npm run build.
    ```
## Application usage
1. Open the web application
    - Open a browser to http://localhost:8080
2. Set the tweet filters (rules)
    - See https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/integrate/build-a-rule for details regarding formatting tweet streaming rules
    - Click the "Delete" button next to existing filters you want to delete
    - Enter a new filter and click the "Add" button to add a new filter
3. Start the tweet analyzer data pipeline
    - Click "Stream" in the web application
    - This will schedule the tweet analyzer job specified in the default.json config file to run every minute for the next ten minutes
    - To confirm that the job was schedule:
        - Log in to the SaaSGlue web [console](https://console.saasglue.com)
        - Click the "Designer" link from the menu bar
        - Select the tweet analyzer job you are using for the data pipeline
        - Click the "Schedules" tab
        - You should see a schedule named "every minute" with the "Is Active" box checked - it should show the next run date within the next minute
4. Monitor data pipeline activity
    - Click the "Monitor" link from the menu bar
    - This view will show each instance of a job - jobs that are schedule but have not started yet are not shown here
    - Each row in the view has two links
        - "Monitor" possibly followed by a number which indicates an auto incrementing job instance id - clicking on this link will show job execution details
            - In the details view you will see a link for each task in the job
            - Click on a task name to see task execution details
            - Keep in mind that a task can execute on multiple agents - if so you will see the execution details for each agent in this view
            - Since a task can consist of multiple steps, as each step in a task starts you will see additional details for each step
            - Note that the "tail" display for each step will show a running update of the script output associated with this step
            - Click the "script" link to see the executed script
            - Click the "stdout" link to see the full stdout
            - Click the "stderr" link to see the full stderr
        - The name of the job definition - clicking this link will take you to the job designer
5. Change the tweets filter
    - Select new filters by deleting existing filters and/or adding new filters in the web application
    - Click the "Reset" button - this will delete existing tweets and launch a job to stream and analyze tweets with the new filters
    - To see ongoing updates click the "Stream" button
