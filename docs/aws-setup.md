# Complete AWS Setup Guide for YOJANASETU

This guide provides step-by-step instructions for a beginner to set up all required AWS services, generate credentials, and seed the database so that YOJANASETU can run in production mode (`USE_AWS=true`).

## Step 1: Create an AWS Account

1. Go to [aws.amazon.com](https://aws.amazon.com/) and click **"Create an AWS Account"** in the top right.
2. Follow the on-screen instructions. You will need to provide an email, password, phone number, and a valid credit/debit card.
3. Choose the **Basic Support - Free** plan when asked.
4. Once your account is active, log in to the **AWS Management Console**.

## Step 2: Select Your Region

1. After logging in, look at the top right corner of the screen next to your username.
2. Click the dropdown and select **Asia Pacific (Mumbai) ap-south-1**.
   *(It's important to use Mumbai to ensure fast response times for Indian users, and this is what the app expects by default).*

## Step 3: Create an IAM User (To get Credentials)

We need to create a "User" for the application so it is allowed to talk to your AWS account securely.

1. In the search bar at the very top, type **IAM** and click on the "IAM" service.
2. On left sidebar, click **Users** → then click the **Create user** button on the right.
3. **User Details:**
   * User name: `yojanasetu-app`
   * Leave "Provide user access to the AWS Management Console" unchecked.
   * Click **Next**.
4. **Permissions:**
   * Select **"Attach policies directly"**.
   * In the search box below, search for and check the box next to these three policies:
     * `AdministratorAccess` *(Note: Because we are setting up Bedrock model access and DynamoDB tables, it is easiest to use Administrator access for this specific backend user while you are learning. For a production public app later, you can restrict this.)*
   * Click **Next** → then click **Create user**.
5. **Generate the Keys:**
   * Click on your newly created `yojanasetu-app` user from the list.
   * Go to the **Security credentials** tab.
   * Scroll down to the "Access keys" section and click **Create access key**.
   * Select **Local code** as the use case, check the confirmation box, and click **Next**.
   * Click **Create access key**.
   * **CRITICAL:** Note down the **Access key ID** and **Secret access key**. Copy and paste them somewhere safe. You will not be able to see the secret key again.
   * Click **Done**.

## Step 4: Amazon Bedrock Access — ✅ Nothing to do!

> **AWS has updated their policy.** The "Model access" page has been retired. Bedrock foundation models (including Claude 3 Sonnet) are now **automatically enabled** the first time your code invokes them. You do not need to manually request or activate anything.

**Skip this step and proceed to Step 5.**

## Step 5: Create DynamoDB Tables

DynamoDB is the database where we will store the government schemes and user chat logs.

1. In the top search bar, type **DynamoDB** and click on the service.
2. In the left sidebar, click **Tables**, then click the orange **Create table** button.
3. **Create the Schemes Table:**
   * Table name: `yojanasetu-schemes`
   * Partition key: `scheme_id` *(Ensure it is spelled exactly like this, lowercase, Type: String)*
   * Leave everything else as default and scroll down to click **Create table**.
4. **Create the Conversations Table:**
   * Click **Create table** again.
   * Table name: `yojanasetu-conversations`
   * Partition key: `conversation_id` *(Type: String)*
   * Click **Create table**.

*(It will take a few seconds for the tables to be created and say "Active".)*

---

## Final Step: Configure Your Code

Now that AWS is ready, we need to plug those details into your code.

1. Open the `.env` file in your `backend/` folder.
2. Update the file to look exactly like this, filling in the keys you saved in Step 3:

```env
# Set to "true" to use real AWS services
USE_AWS=true

# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_HERE
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY_HERE

# Bedrock Model ID
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0

# DynamoDB Table Names
DYNAMODB_SCHEMES_TABLE=yojanasetu-schemes
DYNAMODB_CONVERSATIONS_TABLE=yojanasetu-conversations

# Server
HOST=0.0.0.0
PORT=5000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Seeding Data to AWS

Once your `.env` is updated, the app is pointing to AWS, but your new DynamoDB database is empty! 
Let me know when you've updated the `.env` file with your credentials, and I can write a short Python script to automatically copy your local `backend/data/schemes.json` into your AWS database for you.
