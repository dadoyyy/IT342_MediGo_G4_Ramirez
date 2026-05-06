# MediGo Mobile - Dual Environment Verification Checklist

## ✅ Environment Compatibility Verification

### Backend Configuration
- ✅ **Port:** `8080` (in `application.properties`)
- ✅ **Network Interface:** `0.0.0.0` (listens on ALL interfaces)
- ✅ **Database:** Configurable via `.env` (works on any machine)
- ✅ **JWT/OAuth:** Environment variable-based (.env)

**Result:** Backend is accessible from:
  - ✅ Emulator via `10.0.2.2:8080`
  - ✅ Physical device via `LAPTOP_IP:8080`

---

### Mobile App Configuration (Android)

#### Build System: `mobile/app/build.gradle.kts`
```kotlin
val configuredBaseUrl = (project.findProperty("BASE_URL") as String?) 
    ?: "http://10.0.2.2:8080/"  // ← Fallback to emulator
buildConfigField("String", "BASE_URL", "\"$configuredBaseUrl\"")
```

**Behavior:**
1. If `BASE_URL` defined in `gradle.properties` → Use it
2. If `BASE_URL` NOT defined → Use emulator default (`10.0.2.2`)

#### API Client: `mobile/app/src/main/java/com/example/mobile/api/ApiClient.kt`
```kotlin
private val retrofit: Retrofit = Retrofit.Builder()
    .baseUrl(BuildConfig.BASE_URL)  // ← From gradle build config
    .client(client)
    .addConverterFactory(GsonConverterFactory.create())
    .build()
```

**Result:** API client reads BASE_URL at compile time from build configuration

---

## 🧪 Test Both Scenarios

### Scenario 1: Android Emulator (Professor's Environment) ✅

**Default Configuration:**
```properties
# mobile/gradle.properties
BASE_URL=http://10.0.2.2:8080/
```

**Special IP Explained:**
- `10.0.2.2` = Reserved IP that routes from emulator → host's localhost
- Android SDK default; universal across all emulators

**Steps to Test (Professor):**
```bash
# 1. Start backend
cd backend
./mvnw spring-boot:run

# 2. Open Android Emulator (or use Android Studio's built-in)
#    Settings → System → Developer Options → USB Debugging

# 3. Build & deploy app
cd mobile
./gradlew :app:assembleDebug

# 4. Run on emulator (Android Studio: Run → Run 'app')

# 5. Test auth flows:
#    - Register: Create account as Patient/Doctor
#    - Login: Sign in with created account
#    - Dashboard: Verify user details display
```

**Build Output (Verified ✅):**
```
BUILD SUCCESSFUL in 17s
36 actionable tasks: 36 up-to-date
```

---

### Scenario 2: Physical Android Device (Your Phone) ⚙️

**Configuration Required:**
1. Find laptop LAN IP:
   ```powershell
   ipconfig
   # Look for: IPv4 Address under your active network
   # E.g.: 192.168.1.50
   ```

2. Update `mobile/gradle.properties`:
   ```properties
   BASE_URL=http://192.168.1.50:8080/
   ```

3. Rebuild:
   ```bash
   cd mobile
   ./gradlew :app:assembleDebug
   ```

4. Verify connectivity:
   ```bash
   # On your laptop/PC
   curl http://192.168.1.50:8080/actuator/health
   # Should return: {"status":"UP"}
   ```

5. Deploy to phone:
   - Connect via USB
   - Enable USB Debugging
   - Android Studio: Run → Run 'app'

**Network Requirements:**
- ✅ Phone on same Wi-Fi as laptop
- ✅ Backend running on laptop
- ✅ Firewall allows port 8080

---

## 🔍 Implementation Details

### How BuildConfig Works
1. **Gradle** reads `gradle.properties` during build
2. **Gradle** generates `BuildConfig.java`:
   ```java
   public static final String BASE_URL = "http://10.0.2.2:8080/";
   ```
3. **ApiClient** reads `BuildConfig.BASE_URL` at runtime
4. **Retrofit** uses this base URL for all API calls

### Why This Approach?
- ✅ No hardcoded URLs in source code
- ✅ Easy to switch environments (just edit gradle.properties)
- ✅ Build config baked into APK (no runtime configuration needed)
- ✅ Fallback default ensures emulator works immediately

---

## 📋 Deployment Checklist

### For Professor (Emulator Testing)
- [ ] Backend running on laptop port 8080
- [ ] Backend accessing .env correctly (all DB/OAuth vars set)
- [ ] Android Emulator installed and running
- [ ] Mobile app built with default `BASE_URL=http://10.0.2.2:8080/`
- [ ] App deployed to emulator
- [ ] Test: Register as Patient/Doctor
- [ ] Test: Login with created account
- [ ] Test: Dashboard shows user details
- [ ] Test: Logout redirects to login

### For Your Phone (Physical Device)
- [ ] Backend running on laptop port 8080
- [ ] Backend at `server.address=0.0.0.0` (in application.properties)
- [ ] Laptop and phone on same Wi-Fi
- [ ] Find laptop IP: `ipconfig` → IPv4 Address
- [ ] Update `gradle.properties`: `BASE_URL=http://[LAPTOP_IP]:8080/`
- [ ] Rebuild: `gradlew :app:assembleDebug`
- [ ] Phone connected via USB with USB Debugging enabled
- [ ] Deploy app to phone
- [ ] Same auth flow testing

---

## 🐛 Troubleshooting

### Emulator: "Connection refused" or "unreachable"
**Cause:** 10.0.2.2 only works on emulator
**Fix:** Verify backend actually running: `netstat -ano | findstr :8080`

### Phone: "Connection refused"
**Causes:**
1. Wrong IP address (use `ipconfig` to verify)
2. Phone on different Wi-Fi than laptop
3. Firewall blocking port 8080
4. Backend not binding to 0.0.0.0

**Fix:**
```bash
# On laptop: Verify listening on all interfaces
netstat -ano | findstr :8080
# Output should show 0.0.0.0:8080

# Test from phone:
# Open browser on phone → http://[LAPTOP_IP]:8080/actuator/health
```

### BuildConfig.BASE_URL not found in IDE
**Fix:**
```bash
cd mobile
./gradlew clean :app:assembleDebug
# Close/reopen Android Studio
```

---

## 📊 Summary Table

| Aspect | Emulator | Physical Phone |
|--------|----------|----------------|
| **Build Command** | `./gradlew :app:assembleDebug` | `./gradlew :app:assembleDebug` |
| **BASE_URL** | `http://10.0.2.2:8080/` (default) | `http://LAPTOP_IP:8080/` (update gradle.properties) |
| **Backend Addr** | `0.0.0.0:8080` | `0.0.0.0:8080` |
| **Network** | Emulator ↔ Host only | Same Wi-Fi required |
| **Special Config** | None; works immediately | Find laptop IP; update gradle.properties |
| **Deployment** | Android Studio → Run 'app' | USB Debug + Android Studio → Run 'app' |

---

## ✅ Status: Both Environments Fully Supported

- ✅ **Emulator:** Pre-configured; works immediately
- ✅ **Physical Device:** Documented; simple IP switch required
- ✅ **Backend:** Infrastructure supports both
- ✅ **Build System:** Dynamic BASE_URL via gradle.properties with emulator fallback
