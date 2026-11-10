package co.za.pinin.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import co.za.pinin.app.connectivity.ConnectivityObserver
import co.za.pinin.app.connectivity.NetworkConnectivityObserver
import co.za.pinin.app.ui.OfflineScreen
import co.za.pinin.app.ui.screens.CartScreen
import co.za.pinin.app.ui.screens.HomeScreen
import co.za.pinin.app.ui.screens.ListingDetailScreen
import co.za.pinin.app.ui.theme.PinInTheme
import com.onesignal.OneSignal
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var connectivityObserver: ConnectivityObserver
    private lateinit var viewModel: MainViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = androidx.activity.SystemBarStyle.light(
                android.graphics.Color.WHITE,
                android.graphics.Color.WHITE
            ),
            navigationBarStyle = androidx.activity.SystemBarStyle.light(
                android.graphics.Color.WHITE,
                android.graphics.Color.WHITE
            )
        )

        // 4. Create Notification Channel for Android 8+
        createNotificationChannel()

        // 2. In MainActivity.kt initialize OneSignal on app start
        OneSignal.initWithContext(this, "47242cd4-ecdc-4348-82aa-0274bee57d27")
        lifecycleScope.launch {
            try {
                OneSignal.Notifications.requestPermission(true)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        // 3 & 6. FIX THE CRASH BUG & Show Real System Permission Dialog on Android 13+
        // Uses real system permission dialog (not custom dialog), no finish(), no intent to home screen
        requestSystemNotificationPermission()

        connectivityObserver = NetworkConnectivityObserver(applicationContext)
        viewModel = MainViewModel(connectivityObserver)

        setContent {
            PinInTheme {
                MainAppContainer(viewModel = viewModel)
            }
        }
    }

    /**
     * Create Notification Channel for Android 8+
     * Channel ID = pinin_default
     * Channel Name = PinIn Notifications
     * Importance = IMPORTANCE_HIGH
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channelId = "pinin_default"
            val channelName = "PinIn Notifications"
            val channelDescription = "PinIn push notifications"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(channelId, channelName, importance).apply {
                description = channelDescription
                enableVibration(true)
            }
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            notificationManager?.createNotificationChannel(channel)
        }
    }

    /**
     * Request notification permission on Android 13+ (API 33+) using the real system dialog
     * ActivityCompat.requestPermissions(this, arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 1001)
     */
    private fun requestSystemNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    android.Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(android.Manifest.permission.POST_NOTIFICATIONS),
                    1001
                )
            }
        }
    }

    /**
     * Handles permission request results without closing the activity,
     * launching an intent to the home screen, or finishing the app.
     */
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 1001) {
            // Wait for user to click Allow / Don't Allow without closing activity
        }
    }
}

/**
 * Main application container composable.
 * Renders screens with Material 3 shimmer skeleton loaders during the 2-to-3 second
 * artificial loading delay when opening the app or navigating between screens.
 * Gracefully displays the dedicated OfflineScreen when internet connectivity is lost.
 */
@Composable
fun MainAppContainer(viewModel: MainViewModel) {
    val currentScreen by viewModel.currentScreen.collectAsState()
    val isScreenLoading by viewModel.isScreenLoading.collectAsState()
    val listings by viewModel.listings.collectAsState()
    val cartItems by viewModel.cartItems.collectAsState()

    val networkStatus by viewModel.networkStatus.collectAsState()
    val manualOverride by viewModel.manualOverride.collectAsState()
    val isRetrying by viewModel.isRetrying.collectAsState()

    val effectiveStatus = manualOverride ?: networkStatus
    val isOnline = effectiveStatus == ConnectivityObserver.Status.Available

    // Handle Android system back gesture to navigate back to feed
    BackHandler(enabled = currentScreen !is AppScreen.Home) {
        viewModel.navigateTo(AppScreen.Home)
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // Active Screen Composable with Shimmer Skeletons
        when (val screen = currentScreen) {
            is AppScreen.Home -> {
                HomeScreen(
                    items = listings,
                    isLoading = isScreenLoading,
                    cartCount = cartItems.sumOf { it.quantity },
                    onOpenDetail = { item ->
                        viewModel.navigateTo(AppScreen.Detail(item))
                    },
                    onOpenCart = {
                        viewModel.navigateTo(AppScreen.Cart)
                    }
                )
            }
            is AppScreen.Detail -> {
                ListingDetailScreen(
                    item = screen.item,
                    isLoading = isScreenLoading,
                    onBack = { viewModel.navigateTo(AppScreen.Home) },
                    onAddToCart = { item ->
                        viewModel.addToCart(item)
                    },
                    onBuyNow = { item ->
                        viewModel.addToCart(item)
                        viewModel.navigateTo(AppScreen.Cart)
                    }
                )
            }
            is AppScreen.Cart -> {
                CartScreen(
                    cartItems = cartItems,
                    isLoading = isScreenLoading,
                    onBack = { viewModel.navigateTo(AppScreen.Home) },
                    onUpdateQuantity = { id, qty ->
                        viewModel.updateCartQuantity(id, qty)
                    },
                    onRemoveItem = { id ->
                        viewModel.removeFromCart(id)
                    },
                    onPlaceOrder = {
                        viewModel.clearCart()
                        viewModel.navigateTo(AppScreen.Home)
                    }
                )
            }
        }

        // Dedicated Offline Screen: automatically blocks main content gracefully when offline
        AnimatedVisibility(
            visible = !isOnline,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            OfflineScreen(
                onRetry = { viewModel.retry() },
                isRetrying = isRetrying
            )
        }
    }
}
