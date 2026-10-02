package co.za.pinin.app.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.ShoppingCart
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import co.za.pinin.app.model.ListingItem
import co.za.pinin.app.ui.components.ListingCard
import co.za.pinin.app.ui.components.ListingCardShimmer
import co.za.pinin.app.ui.components.ShimmerBox
import co.za.pinin.app.ui.theme.PinInPrimary

/**
 * Modern Material 3 Home Feed Screen.
 * When loading, displays shimmering skeleton placeholders across all listing cards
 * during the 2-to-3 second delay before revealing real items.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    items: List<ListingItem>,
    isLoading: Boolean,
    cartCount: Int,
    onOpenDetail: (ListingItem) -> Unit,
    onOpenCart: () -> Unit,
    modifier: Modifier = Modifier
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "PinIn",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Black,
                                color = PinInPrimary,
                                letterSpacing = (-0.5).sp
                            )
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = PinInPrimary.copy(alpha = 0.12f)
                        ) {
                            Text(
                                text = "Marketplace",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = PinInPrimary,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                },
                actions = {
                    Box(modifier = Modifier.padding(end = 8.dp)) {
                        IconButton(onClick = onOpenCart) {
                            Icon(
                                imageVector = Icons.Outlined.ShoppingCart,
                                contentDescription = "Cart",
                                tint = MaterialTheme.colorScheme.onSurface
                            )
                        }
                        if (cartCount > 0) {
                            Badge(
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(top = 4.dp, end = 4.dp),
                                containerColor = PinInPrimary,
                                contentColor = Color.White
                            ) {
                                Text(
                                    text = cartCount.toString(),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        modifier = modifier
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Search Bar Placeholder
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                if (isLoading) {
                    ShimmerBox(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(14.dp)
                    )
                } else {
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(horizontal = 14.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Search,
                                contentDescription = "Search",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "Search furniture, decor, appliances…",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                            )
                        }
                    }
                }
            }

            // Category Chips Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (isLoading) {
                    repeat(4) {
                        ShimmerBox(
                            modifier = Modifier.size(width = 65.dp, height = 30.dp),
                            shape = RoundedCornerShape(16.dp)
                        )
                    }
                } else {
                    listOf("All", "Sofas", "Tables", "Chairs").forEachIndexed { index, cat ->
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = if (index == 0) PinInPrimary else MaterialTheme.colorScheme.surfaceVariant,
                            modifier = Modifier.clickable { }
                        ) {
                            Text(
                                text = cat,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (index == 0) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // 2-Column Grid of Listing Cards or Shimmer Skeleton Cards
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                if (isLoading) {
                    items(6) {
                        ListingCardShimmer()
                    }
                } else {
                    items(items, key = { it.id }) { item ->
                        ListingCard(
                            item = item,
                            onClick = { onOpenDetail(item) }
                        )
                    }
                }
            }
        }
    }
}
