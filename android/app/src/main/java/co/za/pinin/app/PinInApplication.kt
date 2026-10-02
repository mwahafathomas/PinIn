package co.za.pinin.app

import android.app.Application
import co.za.pinin.app.onesignal.OneSignalManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Application class initializing OneSignal Android SDK for Native Push Notifications.
 */
class PinInApplication : Application() {

    override fun onCreate() {
        super.onCreate()

        val oneSignalManager = OneSignalManager.getInstance(this)
        CoroutineScope(Dispatchers.IO).launch {
            oneSignalManager.initialize(OneSignalManager.APP_ID)
        }
    }
}
