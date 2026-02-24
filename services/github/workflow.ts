
export const WORKFLOW_YAML = `name: Build Android APK & Deploy Web
on:
  push:
    branches: [ main ]
  workflow_dispatch:

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: write
  pages: write
  id-token: write

jobs:
  build-apk:
    name: Build Android Binary
    runs-on: ubuntu-latest
    env:
      SIGNING_STORE_PASSWORD: ""
      SIGNING_KEY_ALIAS: ""
      SIGNING_KEY_PASSWORD: ""
      SUPABASE_URL: \${{ secrets.SUPABASE_URL }}
      SUPABASE_KEY: \${{ secrets.SUPABASE_KEY }}
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
      
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Initialize and Build
        run: |
          # 1. Cleanup
          rm -rf www android
          mkdir -p www
          
          # 2. Stage 1: Copy base files (Root to WWW)
          # We copy all files except folders to the root of www
          find . -maxdepth 1 -type f -not -name ".*" -exec cp {} www/ \;
          
          # 3. Stage 2: Modular Injection (App Folder content to WWW)
          if [ -d "app" ]; then
            echo "Uplink: Injecting modular app files..."
            cp -rf app/* www/
          fi
          
          # 4. Final Integrity Check & Environment Injection
          if [ ! -f "www/index.html" ]; then
             echo "<h1>System Error: Entry point not found.</h1>" > www/index.html
          fi

          # Inject Supabase Config if secrets are present
          if [ ! -z "$SUPABASE_URL" ]; then
            echo "Injecting Database Bridge..."
            sed -i 's/<head>/<head><script>window.StudioDatabase={url:"'\${SUPABASE_URL}'",key:"'\${SUPABASE_KEY}'"};<\/script>/' www/index.html
          fi

          # 5. Capacitor Environment Setup
          echo '{"appId": "com.oneclick.studio", "appName": "OneClickApp", "webDir": "www"}' > capacitor.config.json
          if [ ! -f package.json ]; then npm init -y; fi
          npm install @capacitor/core@latest @capacitor/cli@latest @capacitor/android@latest
          
          # 6. Native Compilation
          npx cap add android
          
          # Ensure Java 21 compatibility
          if [ -f "android/app/build.gradle" ]; then
            sed -i 's/JavaVersion.VERSION_17/JavaVersion.VERSION_21/g' android/app/build.gradle
          fi
          
          npx cap sync android
          
          # 7. Execute Binary Compilation
          if [ -f android/app/release-key.jks ]; then
            echo "Building Signed Release..."
            cd android && chmod +x gradlew
            ./gradlew assembleRelease \\
              -Pandroid.injected.signing.store.file=release-key.jks \\
              -Pandroid.injected.signing.store.password=\${{ env.SIGNING_STORE_PASSWORD }} \\
              -Pandroid.injected.signing.key.alias=\${{ env.SIGNING_KEY_ALIAS }} \\
              -Pandroid.injected.signing.key.password=\${{ env.SIGNING_KEY_PASSWORD }}
          else
            echo "Building Unsigned Debug Binary..."
            cd android && chmod +x gradlew && ./gradlew assembleDebug
          fi

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: \${{ hashFiles('android/app/release-key.jks') != '' && 'app-release' || 'app-debug' }}
          path: android/app/build/outputs/apk/**/*.apk

  deploy-admin:
    name: Deploy Admin Panel
    runs-on: ubuntu-latest
    needs: build-apk
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        id: pages_setup
        uses: actions/configure-pages@v4
        continue-on-error: true
        
      - name: Prepare Artifact
        run: |
          mkdir -p public_admin
          if [ -d "admin" ] && [ -f "admin/index.html" ]; then
            cp -r admin/* public_admin/
          else
            echo "<h1>Admin node not found. Mobile binary built successfully.</h1>" > public_admin/index.html
          fi

      - name: Upload Pages Artifact
        uses: actions/upload-pages-artifact@v3
        if: steps.pages_setup.outcome == 'success'
        with:
          path: 'public_admin/'

      - name: Deploy to GitHub Pages
        id: deployment
        if: steps.pages_setup.outcome == 'success'
        uses: actions/deploy-pages@v4
        continue-on-error: true
`;
