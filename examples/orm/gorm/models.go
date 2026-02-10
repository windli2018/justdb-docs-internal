// GORM Models Example
//
// This example demonstrates GORM models generated from JustDB schema.
// GORM (Go Object-Relational Mapping) for Go database operations.

package models

import (
	"time"
	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	ID        uint           `gorm:"primary_key" json:"id"`
	Username  string         `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	Email     *string        `gorm:"type:varchar(100);uniqueIndex" json:"email,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Orders    []Order `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"orders,omitempty"`
	Posts     []Post  `gorm:"foreignKey:AuthorID;constraint:OnDelete:CASCADE" json:"posts,omitempty"`
	Comments  []Comment `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"comments,omitempty"`
}

// TableName specifies the table name for User
func (User) TableName() string {
	return "users"
}

// BeforeCreate hook
func (u *User) BeforeCreate(tx *gorm.DB) error {
	// Add any pre-create logic here
	return nil
}

// Category represents a product category
type Category struct {
	ID          uint           `gorm:"primary_key" json:"id"`
	Name        string         `gorm:"type:varchar(100);uniqueIndex;not null" json:"name"`
	Description *string        `gorm:"type:text" json:"description,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Products    []Product `gorm:"foreignKey:CategoryID;constraint:OnDelete:SET NULL" json:"products,omitempty"`
}

func (Category) TableName() string {
	return "categories"
}

// Product represents a product in the catalog
type Product struct {
	ID          uint           `gorm:"primary_key" json:"id"`
	CategoryID  *uint          `gorm:"type:int;index" json:"category_id,omitempty"`
	Name        string         `gorm:"type:varchar(200);not null" json:"name"`
	Description *string        `gorm:"type:text" json:"description,omitempty"`
	Price       float64        `gorm:"type:decimal(10,2);not null" json:"price"`
	Stock       int            `gorm:"default:0;not null" json:"stock"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Category    *Category     `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	OrderItems  []OrderItem   `gorm:"foreignKey:ProductID;constraint:OnDelete:CASCADE" json:"order_items,omitempty"`
}

func (Product) TableName() string {
	return "products"
}

// Order represents a customer order
type Order struct {
	ID          uint           `gorm:"primary_key" json:"id"`
	UserID      uint           `gorm:"type:int;not null;index" json:"user_id"`
	TotalAmount float64        `gorm:"type:decimal(10,2);default:0;not null" json:"total_amount"`
	Status      string         `gorm:"type:varchar(20);default:pending;not null" json:"status"`
	CreatedAt   time.Time      `json:"created_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	User        User          `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
	Items       []OrderItem   `gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE" json:"items,omitempty"`
}

func (Order) TableName() string {
	return "orders"
}

// CalculateTotal calculates the total amount from order items
func (o *Order) CalculateTotal() float64 {
	total := 0.0
	for _, item := range o.Items {
		total += float64(item.Quantity) * item.UnitPrice
	}
	o.TotalAmount = total
	return total
}

// OrderItem represents an item in an order
type OrderItem struct {
	ID        uint          `gorm:"primary_key" json:"id"`
	OrderID   uint          `gorm:"type:int;not null;index" json:"order_id"`
	ProductID uint          `gorm:"type:int;not null;index" json:"product_id"`
	Quantity  int           `gorm:"not null" json:"quantity"`
	UnitPrice float64       `gorm:"type:decimal(10,2);not null" json:"unit_price"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Order     Order         `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	Product   Product       `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}

func (OrderItem) TableName() string {
	return "order_items"
}

// LineTotal calculates the line item total
func (oi *OrderItem) LineTotal() float64 {
	return float64(oi.Quantity) * oi.UnitPrice
}

// Post represents a blog post or article
type Post struct {
	ID        uint           `gorm:"primary_key" json:"id"`
	AuthorID  uint           `gorm:"type:int;not null;index" json:"author_id"`
	Title     string         `gorm:"type:varchar(200);not null" json:"title"`
	Content   string         `gorm:"type:text;not null" json:"content"`
	Published bool           `gorm:"default:false;not null" json:"published"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Author    User          `gorm:"foreignKey:AuthorID;constraint:OnDelete:CASCADE" json:"author,omitempty"`
	Comments  []Comment     `gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE" json:"comments,omitempty"`
}

func (Post) TableName() string {
	return "posts"
}

// Comment represents a comment on a post
type Comment struct {
	ID        uint           `gorm:"primary_key" json:"id"`
	PostID    uint           `gorm:"type:int;not null;index" json:"post_id"`
	UserID    uint           `gorm:"type:int;not null;index" json:"user_id"`
	Content   string         `gorm:"type:text;not null" json:"content"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Post      Post          `gorm:"foreignKey:PostID" json:"post,omitempty"`
	User      User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (Comment) TableName() string {
	return "comments"
}

// AutoMigrate runs auto migration for all models
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&User{},
		&Category{},
		&Product{},
		&Order{},
		&OrderItem{},
		&Post{},
		&Comment{},
	)
}
