const { MongoClient } = require("mongodb");

const mongodbUrl = "mongodb://localhost:27017/";
const dbName = 'Lotte'
const collectionName = 'account'

let client = new MongoClient(mongodbUrl);

const dbCollection = client.db(dbName).collection(collectionName);

async function connectToMongoDB() {
    try {
        await client.connect();
    } catch (err) {
        throw err;
    }
}

async function closeMongoDBConnection() {
    if(client) {
        await client.close()
            .then(() => {
                console.log('Disconnected from MongoDB');
                process.exit(0);
            })
            .catch((error) => {
                console.error('Failed to disconnect from MongoDB', error);
                process.exit(1);
            })
    } else {
        process.exit(0)
    }
}

async function register(username, email, password, phoneNumber) {
    const client = new MongoClient(mongodbUrl, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        // Connect to MongoDB
        await client.connect();

        // Access database and collection
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Check if username or email already exists
        const existingUser = await collection.findOne({ $or: [{ username: username }, { email: email }] });
        if (existingUser) {
            throw new Error('Username or email already exists');
        }

        // Insert new user
        const newUser = {
            username: username,
            email: email,
            password: password,
            phoneNumber: phoneNumber,
            role: "user" // Assign role as "user"
        };
        const result = await collection.insertOne(newUser);
        console.log('New user registered:', result.insertedId);

        return result.insertedId; // Return the inserted user's ID
    } catch (error) {
        throw error;
    } finally {
        // Close the MongoDB connection
        await client.close();
    }
}

async function loginUser(username, password) {
    try {
        // Connect to MongoDB
        await client.connect();

        // Access database and collection
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Find user by username and password
        const user = await collection.findOne({ username: username, password: password });

        // If user not found, return null
        if (!user) {
            return null;
        }

        // Extract role from user object
        const role = user.role;

        // Return role based on its value
        switch (role) {
            case 'user':
                return 'user';
            case 'staff':
                return 'staff';
            case 'admin':
                return 'admin';
            default:
                return null; // Unknown role
        }
    } catch (error) {
        console.error('Đã xảy ra lỗi:', error);
    } finally {
        // Close the MongoDB connection
        await client.close();
    }
}


// Hàm để thêm sản phẩm vào giỏ hàng và lưu vào MongoDB
async function addToCartAndSaveToMongoDB(userId, productId, productName, productPrice) {
    try {
        await client.connect();
        const database = client.db('Lotte');
        const cartCollection = database.collection('cart');

        // Tạo một biến status cho trạng thái xử lý
        const status = 'processing';

        // Tìm kiếm giỏ hàng của người dùng
        const existingCart = await cartCollection.findOne({ userId: userId });

        if (existingCart) {
            // Nếu giỏ hàng đã tồn tại, chỉ cần thêm sản phẩm vào mảng items và cập nhật trạng thái
            const updatedCart = {
                $push: {
                    items: { productId: productId, name: productName, price: productPrice }
                },
                $set: {
                    status: status
                }
            };
            await cartCollection.updateOne({ userId: userId }, updatedCart);
            console.log('Sản phẩm đã được thêm vào giỏ hàng của bạn.');
        } else {
            // Nếu giỏ hàng chưa tồn tại, tạo mới giỏ hàng và thêm sản phẩm vào
            const newCart = {
                userId: userId,
                items: [{ productId: productId, name: productName, price: productPrice }],
                status: status
            };
            await cartCollection.insertOne(newCart);
            console.log('Giỏ hàng mới đã được tạo và sản phẩm đã được thêm vào.');
        }
    } catch (error) {
        console.error('Đã xảy ra lỗi:', error);
    } finally {
        await client.close();
    }
}


async function removeFromCartByProductId(userId, productId) {
    try {
        await client.connect();
        const database = client.db('Lotte');
        const cartCollection = database.collection('cart');
        
        // Chuyển đổi productId sang kiểu Int32
        const intProductId = parseInt(productId);

        // Tìm bản ghi chứa userId và có một hoặc nhiều sản phẩm có productId giống với productId được cung cấp
        const cart = await cartCollection.findOne({ userId: userId });

        if (cart) {
            // Tìm index của sản phẩm có productId cần xóa trong mảng items
            const index = cart.items.findIndex(item => parseInt(item.productId) === intProductId);
            
            if (index !== -1) {
                // Xóa sản phẩm khỏi mảng items
                cart.items.splice(index, 1);
                
                // Cập nhật lại giỏ hàng trong cơ sở dữ liệu
                await cartCollection.updateOne(
                    { userId: userId },
                    { $set: { items: cart.items } }
                );
                
                console.log(`Đã xóa sản phẩm có ID ${intProductId} khỏi giỏ hàng của userId ${userId}`);

                // Kiểm tra nếu mảng items rỗng, xóa luôn userId
                if (cart.items.length === 0) {
                    await cartCollection.deleteOne({ userId: userId });
                    console.log(`Giỏ hàng của userId ${userId} đã bị xóa vì không có sản phẩm nào.`);
                }
            } else {
                console.log(`Không tìm thấy hoặc không có sản phẩm có ID ${intProductId} trong giỏ hàng của userId ${userId}`);
            }
        } else {
            console.log(`Không tìm thấy giỏ hàng của userId ${userId}`);
        }
    } catch (error) {
        console.error('Đã xảy ra lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
    } finally {
        await client.close();
    }
}



// removeFromCartByProductId('user123', '3')


async function getUserCartItems(userId) {
    try {
        await client.connect();
        const database = client.db('Lotte');
        const cartCollection = database.collection('cart');

        // Tìm bản ghi chứa userId
        const userCart = await cartCollection.findOne({ userId: userId });

        // Trả về mảng các mặt hàng nếu tìm thấy hoặc mảng rỗng nếu không tìm thấy
        return userCart ? userCart.items : [];
    } catch (error) {
        console.error('Đã xảy ra lỗi khi tìm kiếm sản phẩm trong giỏ hàng:', error);
        return [];
    } finally {
        await client.close();
    }
}

async function getProductsByProcessingUsers() {
    try {
        await client.connect();
        const database = client.db('Lotte');
        const cartCollection = database.collection('cart');

        // Lấy danh sách các sản phẩm của các userId có Status là "processing"
        const products = await cartCollection.find({ "status": "processing" }).toArray();

        console.log("Products of users with processing status:", products);
        
        return products;
    } catch (error) {
        console.error('Đã xảy ra lỗi khi lấy thông tin từ MongoDB:', error);
        return [];
    } finally {
        await client.close();
    }
}

async function updateStatusToDone(userId) {
    try {
        await client.connect();
        const database = client.db('Lotte');
        const cartCollection = database.collection('cart');

        // Truy vấn để cập nhật status thành "done" cho userId cụ thể
        const result = await cartCollection.updateMany(
            { userId: userId, status: "processing" }, // Điều kiện tìm kiếm
            { $set: { status: "done" } } // Giá trị mới của status
        );

        console.log(`${result.modifiedCount} documents updated`);

        return result.modifiedCount;
    } catch (error) {
        console.error('Đã xảy ra lỗi khi cập nhật status:', error);
        return 0;
    } finally {
        await client.close();
    }
}

async function addProduct(productName, productId, productPrice, productImg) {
    try {
        // Kết nối đến MongoDB
        await client.connect();

        // Chọn cơ sở dữ liệu và bảng sản phẩm
        const database = client.db('Lotte'); // Thay 'your_database_name' bằng tên cơ sở dữ liệu thực tế
        const productsCollection = database.collection('products'); // Thay 'products' bằng tên bảng sản phẩm thực tế

        // Tạo một đối tượng sản phẩm mới
        const newProduct = {
            productName: productName,
            productId: productId,
            productPrice: productPrice,
            productImg: productImg // Thêm thuộc tính img
        };

        // Thêm sản phẩm vào cơ sở dữ liệu
        await productsCollection.insertOne(newProduct);

        console.log(`Đã thêm sản phẩm có id: ${productId} thành công!`);
    } catch (error) {
        console.error('Lỗi khi thêm sản phẩm:', error);
        return 'Đã xảy ra lỗi khi thêm sản phẩm.';
    } finally {
        // Đóng kết nối với MongoDB client
        await client.close();
    }
}


async function findProductList() {
    await client.connect();
    const database = client.db('Lotte');
    const productCollection = database.collection('products');
    const documents = await productCollection.find().toArray();
    return documents;
}


async function deleteProduct(productId) {
    try {
        await client.connect();
        const database = client.db('Lotte');
        const productCollection = database.collection('products');

        const result = await productCollection.deleteOne({ productId: productId });
        if (result.deletedCount === 1) {
            console.log('Product deleted successfully.');
            return true; // Trả về true nếu xóa thành công
        } else {
            console.log('Product not found.');
            return false; // Trả về false nếu sản phẩm không tồn tại trong cơ sở dữ liệu
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        return false; // Trả về false nếu có lỗi xảy ra trong quá trình xóa sản phẩm
    } finally {
        await client.close();
    }
}

async function updateProduct(productId, updatedProductName, updatedProductPrice, updatedProductImg) {
    try {
        await client.connect();
        const database = client.db('Lotte');
        const productCollection = database.collection('products');

        // Tạo điều kiện tìm kiếm dựa trên productId
        const filter = { productId: productId };

        // Tạo dữ liệu mới cần cập nhật
        const updateDoc = {
            $set: {
                productName: updatedProductName,
                productPrice: updatedProductPrice,
                productImg: updatedProductImg // Thêm dữ liệu hình ảnh vào cập nhật
            }
        };

        // Thực hiện cập nhật và lấy kết quả
        const result = await productCollection.updateOne(filter, updateDoc);

        // Kiểm tra xem có sản phẩm nào được cập nhật không
        if (result.modifiedCount === 1) {
            console.log('Product updated successfully.');
            return true; // Trả về true nếu cập nhật thành công
        } else {
            console.log('Product not found or no changes were made.');
            return false; // Trả về false nếu không tìm thấy sản phẩm hoặc không có thay đổi nào được thực hiện
        }
    } catch (error) {
        console.error('Error updating product:', error);
        return false; // Trả về false nếu có lỗi xảy ra trong quá trình cập nhật sản phẩm
    } finally {
        await client.close();
    }
}


async function getProductById(productId) {
    try {
        // Kết nối đến MongoDB
        await client.connect();

        // Chọn cơ sở dữ liệu và bảng sản phẩm
        const database = client.db('Lotte'); // Thay 'your_database_name' bằng tên cơ sở dữ liệu thực tế
        const productsCollection = database.collection('products'); // Thay 'products' bằng tên bảng sản phẩm thực tế

        // Tìm sản phẩm theo productId
        const product = await productsCollection.findOne({ productId: productId });

        if (product) {
            return product;
        } else {
            console.log(`Không tìm thấy sản phẩm có ID: ${productId}`);
            return null;
        }
    } catch (error) {
        console.error('Lỗi khi lấy thông tin sản phẩm:', error);
        return null;
    } finally {
        // Đóng kết nối với MongoDB client
        await client.close();
    }
}



module.exports = {
    connectToMongoDB,
    closeMongoDBConnection,
    register,
    loginUser,
    connectToMongoDB,
    closeMongoDBConnection,
    addToCartAndSaveToMongoDB,
    removeFromCartByProductId,
    getUserCartItems,
    getProductsByProcessingUsers,
    updateStatusToDone,
    addProduct,
    findProductList,
    deleteProduct,
    updateProduct,
    getProductById
};