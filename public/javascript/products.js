const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

function output(products) {
    let tableHtml = `
        <html>
            <head>
                <title>Product List</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        background-color: #f4f4f4;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        background-color: #fff;
                        box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
                    }
                    th, td {
                        padding: 12px 15px;
                        text-align: left;
                        border-bottom: 1px solid #ddd;
                    }
                    th {
                        background-color: #007bff;
                        color: #fff;
                    }
                    tr:nth-child(even) {
                        background-color: #f2f2f2;
                    }
                    .center {
                        text-align: center;
                    }
                    .btn {
                        padding: 8px 16px;
                        margin: 5px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                    }
                    .edit {
                        background-color: #ffca28;
                    }
                    .delete {
                        background-color: #f44336;
                    }
                </style>
            </head>
            <body>
                <h1 class="center">Product List</h1>
                <table>
                    <tr>
                        <th>Product Name</th>
                        <th>Product ID</th>
                        <th>Product Price</th>
                        <th>Product Image</th> <!-- Thêm cột hình ảnh -->
                        <th>Actions</th>
                    </tr>
    `;

    products.forEach(product => {
        let imageSrc = product.productImg ? `public/images/${product.productImg}` : 'default/path/to/image';
        tableHtml += `
            <tr>
                <td>${product.productName}</td>
                <td>${product.productId}</td>
                <td>$${product.productPrice}</td>
                <td><img src="${imageSrc}" alt="Product Image" style="max-width: 100px;"></td> <!-- Hiển thị hình ảnh -->
                <td>
                    <button class="btn edit" onclick="redirectToAdminUpdate('${product.productId}')">Edit</button>
                    <button class="btn delete" onclick="deleteProduct('${product.productId}')">Delete</button>
                </td>
            </tr>
        `;
    });

    tableHtml += `
                </table>
            </body>
            <script>
                function redirectToAdminUpdate(productId) {
                    // Chuyển hướng đến trang adminUpdate.html với productId được truyền vào
                    window.location.href = 'adminUpdate.html?productId=' + productId;
                }
                
                ${deleteProduct}  // Thêm hàm deleteProduct vào đây
            </script>
        </html>
    `;
    return tableHtml;
}

function deleteProduct(id) {
    // Xác nhận với người dùng trước khi xóa
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
        console.log(id);
        fetch(`/api/delete-product/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                console.log('Product deleted successfully.');
                // Thực hiện các thao tác cần thiết sau khi xóa thành công, ví dụ: cập nhật giao diện
                location.reload()
            } else {
                console.error('Failed to delete product:', response.statusText);
                // Xử lý lỗi hoặc hiển thị thông báo cho người dùng nếu xóa không thành công
            }
        })
        .catch(error => {
            console.error('Error deleting product:', error);
            // Xử lý lỗi nếu có lỗi trong quá trình gửi yêu cầu
        });
    }
}

//<button class="btn delete" onclick="deleteProduct('${product.productId}')">Delete</button>



module.exports = {
    output,
    deleteProduct
}
