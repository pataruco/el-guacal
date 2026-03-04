use axum::{
    body::Body,
    extract::State,
    http::{header, Response, StatusCode},
    response::IntoResponse,
};
use csv::Writer;
use serde::Serialize;
use sqlx::{PgPool, Row};
use std::io::Cursor;
use uuid::Uuid;
use zip::{write::SimpleFileOptions, ZipWriter};

#[derive(Serialize, Clone)]
struct StoreExport {
    store_id: Uuid,
    name: String,
    address: String,
    lat: f64,
    lng: f64,
    product_ids: String,
}

#[derive(Serialize, Clone)]
struct ProductExport {
    product_id: Uuid,
    name: String,
    brand: String,
}

#[derive(Serialize)]
struct FullExport {
    stores: Vec<StoreExport>,
    products: Vec<ProductExport>,
}

pub async fn export_zip_handler(State(pool): State<PgPool>) -> impl IntoResponse {
    let mut conn = match pool.acquire().await {
        Ok(conn) => conn,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Database connection error").into_response(),
    };

    // Fetch all products
    let products_rows = match sqlx::query("SELECT product_id, name, brand FROM products")
        .fetch_all(&mut *conn)
        .await
    {
        Ok(rows) => rows,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Error fetching products").into_response(),
    };

    let products: Vec<ProductExport> = products_rows
        .into_iter()
        .map(|row| ProductExport {
            product_id: row.get("product_id"),
            name: row.get("name"),
            brand: row.get("brand"),
        })
        .collect();

    // Fetch all stores with their product IDs
    let stores_rows = match sqlx::query(
        r#"
        SELECT
            s.store_id,
            s.name,
            s.address,
            ST_Y(s.location::geometry) as lat,
            ST_X(s.location::geometry) as lng,
            COALESCE(string_agg(sp.product_id::text, ';'), '') as product_ids
        FROM stores s
        LEFT JOIN store_products sp ON s.store_id = sp.store_id
        GROUP BY s.store_id
        "#
    )
    .fetch_all(&mut *conn)
    .await
    {
        Ok(rows) => rows,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Error fetching stores").into_response(),
    };

    let stores: Vec<StoreExport> = stores_rows
        .into_iter()
        .map(|row| StoreExport {
            store_id: row.get("store_id"),
            name: row.get("name"),
            address: row.get("address"),
            lat: row.get("lat"),
            lng: row.get("lng"),
            product_ids: row.get("product_ids"),
        })
        .collect();

    let full_export = FullExport {
        stores: stores.clone(),
        products: products.clone(),
    };

    // Create ZIP in memory
    let mut buf = Vec::new();
    {
        let mut zip = ZipWriter::new(Cursor::new(&mut buf));
        let options = SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Deflated)
            .unix_permissions(0o644);

        // Add data.json
        if zip.start_file("data.json", options).is_err() {
            return (StatusCode::INTERNAL_SERVER_ERROR, "Error creating ZIP file").into_response();
        }
        if serde_json::to_writer(&mut zip, &full_export).is_err() {
            return (StatusCode::INTERNAL_SERVER_ERROR, "Error writing JSON to ZIP").into_response();
        }

        // Add stores.csv
        if zip.start_file("stores.csv", options).is_err() {
            return (StatusCode::INTERNAL_SERVER_ERROR, "Error creating ZIP file").into_response();
        }
        {
            let mut csv_writer = Writer::from_writer(&mut zip);
            for store in &stores {
                if csv_writer.serialize(store).is_err() {
                    return (StatusCode::INTERNAL_SERVER_ERROR, "Error writing CSV to ZIP").into_response();
                }
            }
            if csv_writer.flush().is_err() {
                return (StatusCode::INTERNAL_SERVER_ERROR, "Error flushing CSV").into_response();
            }
        }

        // Add products.csv
        if zip.start_file("products.csv", options).is_err() {
            return (StatusCode::INTERNAL_SERVER_ERROR, "Error creating ZIP file").into_response();
        }
        {
            let mut csv_writer = Writer::from_writer(&mut zip);
            for product in &products {
                if csv_writer.serialize(product).is_err() {
                    return (StatusCode::INTERNAL_SERVER_ERROR, "Error writing CSV to ZIP").into_response();
                }
            }
            if csv_writer.flush().is_err() {
                return (StatusCode::INTERNAL_SERVER_ERROR, "Error flushing CSV").into_response();
            }
        }

        if zip.finish().is_err() {
            return (StatusCode::INTERNAL_SERVER_ERROR, "Error finishing ZIP file").into_response();
        }
    }

    Response::builder()
        .header(header::CONTENT_TYPE, "application/zip")
        .header(header::CONTENT_DISPOSITION, "attachment; filename=\"el-guacal-db.zip\"")
        .body(Body::from(buf))
        .unwrap()
        .into_response()
}
