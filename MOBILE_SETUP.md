# MediGo Mobile Setup Guide

## Quick Start (Emulator - Default)

The mobile app is **pre-configured for Android Emulator** by default. Your professor can:

1. **Start backend** (Spring Boot on port 8080)
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

2. **Open emulator** (Android Emulator or Android Studio device)

3. **Build & run mobile app**
   ```bash
   cd mobile
   ./gradlew :app:assembleDebug
   ```
   
4. **Flash to emulator** or run from Android Studio (Run → Run 'app')

✅ App will connect to `http://10.0.2.2:8080/` automatically (emulator's localhost route)

---

## Physical Device Testing (Your Phone)

If you want to test on your **physical Android phone**:

### Step 1: Find Your Laptop's LAN IP
**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network, e.g., `192.168.1.50`

**macOS/Linux:**
```bash
ifconfig | grep "inet "
```

### Step 2: Update `mobile/gradle.properties`
Change:
```properties
BASE_URL=http://10.0.2.2:8080/
```

To:
```properties
BASE_URL=http://192.168.1.50:8080/
```
(Replace `192.168.1.50` with your laptop's actual LAN IP)

### Step 3: Ensure Backend Listens on All Interfaces
Verify `backend/application.properties` contains:
```properties
server.address=0.0.0.0
server.port=8080
```

### Step 4: Build & Deploy
```bash
cd mobile
./gradlew :app:assembleDebug
```
In Android Studio:
- Connect phone via USB (enable USB Debugging in Developer Options)
- Click "Run" → phone receives APK

### Step 5: Test
- Phone must be on **same Wi-Fi network** as laptop
- Verify backend is running: `curl http://192.168.1.50:8080/actuator/health`

---

## How the Build System Works

**File:** `mobile/app/build.gradle.kts`

```kotlin
val configuredBaseUrl = (project.findProperty("BASE_URL") as String?) 
    ?: "http://10.0.2.2:8080/"
buildConfigField("String", "BASE_URL", "\"$configuredBaseUrl\"")
```

- **If `BASE_URL` is set in `gradle.properties`** → Uses that value
- **If `BASE_URL` is NOT set** → Falls back to emulator default (`10.0.2.2`)

The API client reads this at runtime:
```kotlin
// File: mobile/app/src/main/java/com/example/mobile/api/ApiClient.kt
private val retrofit: Retrofit = Retrofit.Builder()
    .baseUrl(BuildConfig.BASE_URL)  ← Reads from gradle.properties
    .client(client)
    .addConverterFactory(GsonConverterFactory.create())
    .build()
```

---

## Troubleshooting

### "Failed to connect to backend"
1. ✅ Backend is running on port 8080?
   ```bash
   # Linux/macOS
   netstat -tuln | grep 8080
   
   # Windows
   netstat -ano | find ":8080"
   ```

2. ✅ Correct `BASE_URL` for your device?
   - Emulator: `http://10.0.2.2:8080/`
   - Physical phone: `http://YOUR_LAPTOP_IP:8080/`

3. ✅ Phone on same Wi-Fi as laptop? (physical device only)

4. ✅ Firewall allows port 8080?

### "BuildConfig.BASE_URL not found"
- Close/reopen Android Studio
- Run: `./gradlew clean :app:assembleDebug`

### Still having issues?
Check logs in Android Studio's Logcat:
- Filter: `BASE_URL` or `ApiClient`
- Look for actual URL being used and connection errors

---

## Summary

| Environment | `BASE_URL` | Notes |
|---|---|---|
| **Emulator** | `http://10.0.2.2:8080/` | Default, works immediately |
| **Physical Phone** | `http://YOUR_LAPTOP_IP:8080/` | Update `gradle.properties` |

✅ Both scenarios are **fully supported**.
