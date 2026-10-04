package co.za.pinin.app

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
import co.za.pinin.app.connectivity.ConnectivityObserver
import co.za.pinin.app.connectivity.NetworkConnectivityObserver
import co.za.pinin.app.onesignal.setupPushSubscriptionObserver
import co.za.pinin.app.ui.OfflineScreen
import co.za.pinin.app.ui.screens.CartScreen
import co.za.pinin.app.ui.screens.HomeScreen
import co.za.pinin.app.ui.screens.ListingDetailScreen
import co.za.pinin.app.ui.theme.PinInTheme
import androidx.lifecycle.lifecycleScope
import com.onesignal.OneSignal
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var connectivityObserver: ConnectivityObserver
    private lateinit var viewModel: MainViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        connectivityObserver = NetworkConnectivityObserver(applicationContext)
        viewModel = MainViewModel(connectivityObserver)

        // OneSignal push subscription observer and integration complete verification
        setupPushSubscriptionObserver(this)

        // Request notification permission with a 3-second delay after first launch
        lifecycleScope.launch {
            delay(3000)
            try {
                OneSignal.Notifications.requestPermission(true)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        setContent {
            PinInTheme {
                MainAppContainer(viewModel = viewModel)
            }
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
