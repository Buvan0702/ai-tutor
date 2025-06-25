# Deploying to Vercel

This guide provides step-by-step instructions for deploying your Next.js application to Vercel.

## Prerequisites

1.  **Vercel Account**: If you don't have one, sign up at [vercel.com](https://vercel.com).
2.  **Git Repository**: Your project code should be in a Git repository hosted on GitHub, GitLab, or Bitbucket.

## Deployment Steps

### Step 1: Push Your Code to a Git Repository

Make sure your latest code is pushed to your remote Git repository.

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

### Step 2: Import Your Project in Vercel

1.  Log in to your Vercel dashboard.
2.  Click the "**Add New...**" button and select "**Project**".
3.  In the "Import Git Repository" section, find your project's repository and click "**Import**". If you haven't connected your Git provider yet, Vercel will guide you through the process.

### Step 3: Configure Your Project

Vercel will automatically detect that you're deploying a Next.js application and will pre-configure most settings. However, you need to add your Firebase environment variables.

1.  In the "Configure Project" screen, expand the "**Environment Variables**" section.
2.  Add the following variables. You can find these values in your Firebase project settings under **Project Settings > General > Your apps > Firebase SDK snippet > Config**.

    | Name                                  | Value                   |
    | ------------------------------------- | ----------------------- |
    | `NEXT_PUBLIC_FIREBASE_API_KEY`        | `Your-Firebase-API-Key` |
    | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`    | `your-project-id.firebaseapp.com` |
    | `NEXT_PUBLIC_FIREBASE_PROJECT_ID`     | `your-project-id`       |
    | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project-id.appspot.com` |
    | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `your-sender-id`    |
    | `NEXT_PUBLIC_FIREBASE_APP_ID`         | `your-app-id`           |

3.  Ensure you add each variable one by one using the Vercel UI.

### Step 4: Deploy

1.  After adding the environment variables, click the "**Deploy**" button.
2.  Vercel will start the build process. You can monitor the progress in the build logs.
3.  Once the deployment is complete, Vercel will provide you with a URL to your live application. Congratulations!

## Future Deployments

Every time you push a new commit to your main branch, Vercel will automatically trigger a new deployment for you.
