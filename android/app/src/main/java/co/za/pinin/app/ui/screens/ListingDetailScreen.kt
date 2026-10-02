package co.za.pinin.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.*
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import co.za.pinin.app.model.ListingItem
import co.za.pinin.app.ui.components.ShimmerBox
import co.za.pinin.app.ui.components.ShimmerCircle
import co.za.pinin.app.ui.components.ShimmerTextLine
import co.za.pinin.app.ui.theme.PinInPrimary

/**
 * Modern Material 3 Listing Details Page.
 * Automatically displays a full shimmering skeleton loader for images, badges, text,
 * and seller details during navigation loading before revealing Supabase content.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ListingDetailScreen(
    item: ListingItem,
    isLoading: Boolean,
    onBack: () -> Unit,
    onAddToCart: (ListingItem) -> Unit,
    onBuyNow: (ListingItem) -> Unit,
    modifier: Modifier = Modifier
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (isLoading) "Loading item…" else item.title,
                        maxLines = 1,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Outlined.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { }) {
                        Icon(
                            imageVector = Icons.Outlined.Share,
                            contentDescription = "Share"
                        )
                    }
                    IconButton(onClick = { }) {
                        Icon(
                            imageVector = Icons.Outlined.BookmarkBorder,
                            contentDescription = "Save"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        bottomBar = {
            Surface(
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 8.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (isLoading) {
                        ShimmerBox(
                            modifier = Modifier
                                .weight(1f)
                                .height(50.dp),
                            shape = RoundedCornerShape(14.dp)
                        )
                        ShimmerBox(
                            modifier = Modifier
                                .weight(1f)
                                .height(50.dp),
                            shape = RoundedCornerShape(14.dp)
                        )
                    } else {
                        OutlinedButton(
                            onClick = { onAddToCart(item) },
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier
                                .weight(1f)
                                .height(50.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.ShoppingCart,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Add to Cart",
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Button(
                            onClick = { onBuyNow(item) },
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = PinInPrimary),
                            modifier = Modifier
                                .weight(1f)
                                .height(50.dp)
                        ) {
                            Text(
                                text = "Buy Now",
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }
            }
        },
        modifier = modifier
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            if (isLoading) {
                ListingDetailShimmer()
            } else {
                ListingDetailContent(item = item)
            }
        }
    }
}

/**
 * Shimmer Skeleton Loader for Listing Detail Screen.
 */
@Composable
fun ListingDetailShimmer() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        // Hero Image Shimmer Placeholder
        ShimmerBox(
            modifier = Modifier
                .fillMaxWidth()
                .height(300.dp),
            shape = RoundedCornerShape(20.dp)
        )

        Spacer(modifier = Modifier.height(14.dp))

        // Thumbnails Row Shimmer
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            repeat(3) {
                ShimmerBox(
                    modifier = Modifier.size(60.dp),
                    shape = RoundedCornerShape(12.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(18.dp))

        // Badges Row Shimmer
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ShimmerBox(modifier = Modifier.size(width = 75.dp, height = 24.dp), shape = RoundedCornerShape(8.dp))
            ShimmerBox(modifier = Modifier.size(width = 110.dp, height = 24.dp), shape = RoundedCornerShape(8.dp))
            ShimmerBox(modifier = Modifier.size(width = 95.dp, height = 24.dp), shape = RoundedCornerShape(8.dp))
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Title Shimmer Lines
        ShimmerTextLine(height = 22.dp, widthFraction = 0.9f)
        Spacer(modifier = Modifier.height(8.dp))
        ShimmerTextLine(height = 22.dp, widthFraction = 0.6f)

        Spacer(modifier = Modifier.height(16.dp))

        // Price Shimmer Pill
        ShimmerBox(
            modifier = Modifier.size(width = 140.dp, height = 32.dp),
            shape = RoundedCornerShape(8.dp)
        )

        Spacer(modifier = Modifier.height(20.dp))

        // Delivery Card Shimmer
        ShimmerBox(
            modifier = Modifier
                .fillMaxWidth()
                .height(72.dp),
            shape = RoundedCornerShape(16.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Sold By Card Shimmer
        ShimmerBox(
            modifier = Modifier
                .fillMaxWidth()
                .height(84.dp),
            shape = RoundedCornerShape(16.dp)
        )

        Spacer(modifier = Modifier.height(20.dp))

        // Description Paragraph Shimmer Lines
        Text(
            text = "Description",
            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
        )
        Spacer(modifier = Modifier.height(10.dp))
        ShimmerTextLine(height = 14.dp, widthFraction = 1.0f)
        Spacer(modifier = Modifier.height(6.dp))
        ShimmerTextLine(height = 14.dp, widthFraction = 0.95f)
        Spacer(modifier = Modifier.height(6.dp))
        ShimmerTextLine(height = 14.dp, widthFraction = 0.88f)
        Spacer(modifier = Modifier.height(6.dp))
        ShimmerTextLine(height = 14.dp, widthFraction = 0.65f)

        Spacer(modifier = Modifier.height(32.dp))
    }
}

/**
 * Real Loaded Content for Listing Detail Screen.
 */
@Composable
fun ListingDetailContent(item: ListingItem) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        // Hero Image
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(300.dp)
                .clip(RoundedCornerShape(20.dp))
        ) {
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(item.imageUrl)
                    .crossfade(true)
                    .build(),
                contentDescription = item.title,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Badges Row (In Stock, Warranty, Returns, Pay In Person)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            if (item.inStock) {
                Surface(
                    color = Color(0xFF10B981).copy(alpha = 0.12f),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = "In Stock",
                        color = Color(0xFF059669),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
            Surface(
                color = PinInPrimary.copy(alpha = 0.1f),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = item.warranty,
                    color = PinInPrimary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Title
        Text(
            text = item.title,
            style = MaterialTheme.typography.headlineSmall.copy(
                fontWeight = FontWeight.Bold,
                letterSpacing = (-0.5).sp
            )
        )

        Spacer(modifier = Modifier.height(10.dp))

        // Price
        Text(
            text = "R %,.2f".format(item.price),
            style = MaterialTheme.typography.headlineMedium.copy(
                fontWeight = FontWeight.Black,
                color = PinInPrimary
            )
        )

        Spacer(modifier = Modifier.height(18.dp))

        // Delivery Estimation Card
        Surface(
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(PinInPrimary.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Outlined.LocalShipping,
                        contentDescription = "Delivery",
                        tint = PinInPrimary,
                        modifier = Modifier.size(22.dp)
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = "Estimated Delivery",
                        style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = item.deliveryEstimation,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Sold By Merchant Card
        Surface(
            color = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(16.dp),
            shadowElevation = 1.dp,
            border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primaryContainer),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = item.soldBy.take(1).uppercase(),
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = item.soldBy,
                            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Icon(
                            imageVector = Icons.Rounded.CheckCircle,
                            contentDescription = "Verified",
                            tint = Color(0xFF10B981),
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Rounded.Star,
                            contentDescription = null,
                            tint = Color(0xFFF59E0B),
                            modifier = Modifier.size(13.dp)
                        )
                        Spacer(modifier = Modifier.width(3.dp))
                        Text(
                            text = "${item.rating} (${item.reviewCount} reviews)",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Description
        Text(
            text = "Product Details",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = item.description,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            lineHeight = 22.sp
        )

        Spacer(modifier = Modifier.height(28.dp))
    }
}
