package co.za.pinin.app.onesignal

import android.content.Context
import com.onesignal.OneSignal
import com.onesignal.user.subscriptions.IPushSubscriptionObserver
import com.onesignal.user.subscriptions.PushSubscriptionChangedState

// OneSignal stores observers weakly — keep a strong reference for the screen/app lifetime.
private var pushSubscriptionObserver: IPushSubscriptionObserver? = null

/**
 * Sets up a push subscription observer for background diagnostics without any custom popups.
 * The app uses native Android system permission prompt only.
 */
fun setupPushSubscriptionObserver(context: Context) {
    val observer = object : IPushSubscriptionObserver {
        override fun onPushSubscriptionChange(state: PushSubscriptionChangedState) {
            // Passive observer: no in-app alert or custom dialog
        }
    }
    pushSubscriptionObserver = observer
    OneSignal.User.pushSubscription.addObserver(observer)
}
