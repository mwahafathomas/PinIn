package co.za.pinin.app.connectivity

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.launch

/**
 * Modern real-time network connectivity checker.
 * Uses ConnectivityManager and NetworkCapabilities with zero deprecated APIs.
 * Validates actual internet capability via NET_CAPABILITY_INTERNET and NET_CAPABILITY_VALIDATED.
 */
class NetworkConnectivityObserver(
    context: Context
) : ConnectivityObserver {

    private val connectivityManager =
        context.applicationContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    /**
     * Checks if the device currently has active, validated internet connectivity.
     */
    override val isConnected: Boolean
        get() {
            val activeNetwork = connectivityManager.activeNetwork ?: return false
            val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork) ?: return false
            return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                   capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
        }

    /**
     * Emits real-time network status changes as a Kotlin Coroutine Flow.
     */
    override fun observe(): Flow<ConnectivityObserver.Status> {
        return callbackFlow {
            // Send initial connection state immediately
            val initialStatus = if (isConnected) {
                ConnectivityObserver.Status.Available
            } else {
                ConnectivityObserver.Status.Unavailable
            }
            trySend(initialStatus)

            val callback = object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    super.onAvailable(network)
                    val capabilities = connectivityManager.getNetworkCapabilities(network)
                    val hasInternet = capabilities?.let {
                        it.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                        it.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
                    } ?: false

                    launch {
                        send(
                            if (hasInternet) ConnectivityObserver.Status.Available
                            else ConnectivityObserver.Status.Unavailable
                        )
                    }
                }

                override fun onLosing(network: Network, maxMsToLive: Int) {
                    super.onLosing(network, maxMsToLive)
                    launch { send(ConnectivityObserver.Status.Losing) }
                }

                override fun onLost(network: Network) {
                    super.onLost(network)
                    val stillConnected = isConnected
                    launch {
                        send(
                            if (stillConnected) ConnectivityObserver.Status.Available
                            else ConnectivityObserver.Status.Lost
                        )
                    }
                }

                override fun onUnavailable() {
                    super.onUnavailable()
                    launch { send(ConnectivityObserver.Status.Unavailable) }
                }

                override fun onCapabilitiesChanged(
                    network: Network,
                    networkCapabilities: NetworkCapabilities
                ) {
                    super.onCapabilitiesChanged(network, networkCapabilities)
                    val hasInternet = networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                    val isValidated = networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)

                    launch {
                        if (hasInternet && isValidated) {
                            send(ConnectivityObserver.Status.Available)
                        } else {
                            send(ConnectivityObserver.Status.Unavailable)
                        }
                    }
                }
            }

            val request = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build()

            try {
                connectivityManager.registerNetworkCallback(request, callback)
            } catch (e: Exception) {
                trySend(ConnectivityObserver.Status.Unavailable)
            }

            awaitClose {
                try {
                    connectivityManager.unregisterNetworkCallback(callback)
                } catch (_: Exception) {
                    // Ignored if already unregistered or system shutting down
                }
            }
        }.distinctUntilChanged()
    }
}
