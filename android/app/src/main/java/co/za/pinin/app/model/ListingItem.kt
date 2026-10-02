package co.za.pinin.app.model

data class ListingItem(
    val id: String,
    val title: String,
    val price: Double,
    val imageUrl: String,
    val additionalImages: List<String> = emptyList(),
    val description: String,
    val sellerName: String,
    val soldBy: String = sellerName,
    val inStock: Boolean = true,
    val deliveryEstimation: String = "2 to 5 business days",
    val warranty: String = "1-Year Warranty Included",
    val returns: String = "7-Day Free Returns",
    val payInPerson: Boolean = true,
    val rating: Float = 4.9f,
    val reviewCount: Int = 24
)

data class CartItem(
    val item: ListingItem,
    val quantity: Int = 1
)

object SampleListings {
    val items = listOf(
        ListingItem(
            id = "1",
            title = "Modern Scandinavian 3-Seater Oak Sofa",
            price = 4299.00,
            imageUrl = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80",
            additionalImages = listOf(
                "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80"
            ),
            description = "Premium upholstered 3-seater sofa crafted with solid sustainably harvested oak wood and spill-resistant linen fabric. Perfect condition, lightly used in a pet-free home.",
            sellerName = "Cape Town Interiors",
            soldBy = "Cape Town Interiors",
            inStock = true,
            deliveryEstimation = "2 to 4 business days",
            warranty = "1-Year Warranty Included",
            returns = "7-Day Free Returns",
            payInPerson = true,
            rating = 4.9f,
            reviewCount = 38
        ),
        ListingItem(
            id = "2",
            title = "Solid Walnut Minimalist Coffee Table",
            price = 1850.00,
            imageUrl = "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&auto=format&fit=crop&q=80",
            description = "Natural hand-finished solid walnut coffee table with sleek matte black steel hairpin legs. Treated with water-resistant beeswax.",
            sellerName = "Urban Timber Studio",
            soldBy = "Urban Timber Studio",
            inStock = true,
            deliveryEstimation = "3 to 5 business days",
            warranty = "6-Month Craft Warranty",
            returns = "7-Day Free Returns",
            payInPerson = true,
            rating = 4.8f,
            reviewCount = 19
        ),
        ListingItem(
            id = "3",
            title = "Ergonomic Mesh Executive Desk Chair",
            price = 2650.00,
            imageUrl = "https://images.unsplash.com/photo-1580481077195-c3a821a58875?w=800&auto=format&fit=crop&q=80",
            description = "High-performance ergonomic desk chair with 3D lumbar support, adjustable headrest, and breathable mesh back for all-day comfort.",
            sellerName = "Workspace Pro SA",
            soldBy = "Workspace Pro SA",
            inStock = true,
            deliveryEstimation = "2 to 3 business days",
            warranty = "2-Year Manufacturer Warranty",
            returns = "14-Day Free Returns",
            payInPerson = true,
            rating = 4.7f,
            reviewCount = 52
        ),
        ListingItem(
            id = "4",
            title = "Vintage Industrial Floor Lamp with Brass Accents",
            price = 920.00,
            imageUrl = "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80",
            description = "Striking mid-century floor standing lamp with warm Edison filament bulb and solid cast iron weighted base.",
            sellerName = "Retro Glow Lighting",
            soldBy = "Retro Glow Lighting",
            inStock = true,
            deliveryEstimation = "2 to 4 business days",
            warranty = "1-Year Warranty Included",
            returns = "7-Day Free Returns",
            payInPerson = true,
            rating = 5.0f,
            reviewCount = 11
        )
    )
}
