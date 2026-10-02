package co.za.pinin.app.onesignal

import android.app.AlertDialog
import android.content.Context
import android.os.Handler
import android.os.Looper
import com.onesignal.OneSignal
import com.onesignal.user.subscriptions.IPushSubscriptionObserver
import com.onesignal.user.subscriptions.PushSubscriptionChangedState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicBoolean

// Ensures the dialog is shown exactly once
private val dialogShown = AtomicBoolean(false)

// OneSignal stores observers weakly — keep a strong reference for the screen/app lifetime.
private var pushSubscriptionObserver: IPushSubscriptionObserver? = null

// A real, server-assigned subscription ID is non-empty and not the local- placeholder
private fun isRegistered(subscriptionId: String?): Boolean =
    !subscriptionId.isNullOrEmpty() && !subscriptionId.startsWith("local-")

private fun maybeShowIntegrationCompleteDialog(context: Context, subscriptionId: String?) {
    if (isRegistered(subscriptionId) && dialogShown.compareAndSet(false, true)) {
        Handler(Looper.getMainLooper()).post {
            showIntegrationCompleteDialog(context)
        }
    }
}

/**
 * Sets up a push subscription observer so the app can verify that the device
 * registered successfully with OneSignal servers and prompt for permissions.
 */
fun setupPushSubscriptionObserver(context: Context) {
    val observer = object : IPushSubscriptionObserver {
        override fun onPushSubscriptionChange(state: PushSubscriptionChangedState) {
            maybeShowIntegrationCompleteDialog(context, state.current.id)
        }
    }
    pushSubscriptionObserver = observer
    OneSignal.User.pushSubscription.addObserver(observer)

    // The ID may already be server-assigned before the observer attaches,
    // so evaluate the current value immediately as well.
    maybeShowIntegrationCompleteDialog(context, OneSignal.User.pushSubscription.id)
}

fun showIntegrationCompleteDialog(context: Context) {
    AlertDialog.Builder(context)
        .setTitle("Your OneSignal SDK integration is complete!")
        .setMessage(
            "You can now send Push Notifications & In-App Messages through OneSignal. " +
            "Tap below to enable push notifications."
        )
        .setPositiveButton("Got it") { _, _ ->
            requestPushPermission()
        }
        .setCancelable(false)
        .show()
}

fun requestPushPermission() {
    CoroutineScope(Dispatchers.Main).launch {
        OneSignal.Notifications.requestPermission(true)
    }
}
