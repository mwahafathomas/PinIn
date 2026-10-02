package co.za.pinin.app.onesignal

import android.content.Context
import com.onesignal.OneSignal
import com.onesignal.debug.LogLevel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Centralized manager that wraps all OneSignal SDK calls,
 * executing background operations safely on Dispatchers.IO.
 */
class OneSignalManager(private val context: Context) {

    private var isInitialized = false

    suspend fun initialize(appId: String) = withContext(Dispatchers.IO) {
        if (isInitialized) return@withContext

        // Set log level for debugging
        OneSignal.Debug.logLevel = LogLevel.VERBOSE

        // Initialize OneSignal with context
        OneSignal.initWithContext(context, appId)
        isInitialized = true
    }

    suspend fun login(externalId: String) = withContext(Dispatchers.IO) {
        OneSignal.login(externalId)
    }

    suspend fun logout() = withContext(Dispatchers.IO) {
        OneSignal.logout()
    }

    suspend fun setEmail(email: String) = withContext(Dispatchers.IO) {
        OneSignal.User.addEmail(email)
    }

    suspend fun setSmsNumber(number: String) = withContext(Dispatchers.IO) {
        OneSignal.User.addSms(number)
    }

    suspend fun setTag(key: String, value: String) = withContext(Dispatchers.IO) {
        OneSignal.User.addTag(key, value)
    }

    suspend fun removeTag(key: String) = withContext(Dispatchers.IO) {
        OneSignal.User.removeTag(key)
    }

    fun setLogLevel(level: LogLevel) {
        OneSignal.Debug.logLevel = level
    }

    companion object {
        const val APP_ID = "47242cd4-ecdc-4348-82aa-0274bee57d27"

        @Volatile
        private var instance: OneSignalManager? = null

        fun getInstance(context: Context): OneSignalManager {
            return instance ?: synchronized(this) {
                instance ?: OneSignalManager(context.applicationContext).also { instance = it }
            }
        }
    }
}
