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

/// Generates a ZIP file containing the database export.
///
/// # Panics
///
/// This function will panic if it fails to build the HTTP response.
pub async fn export_zip_handler(State(pool): State<PgPool>) -> impl IntoResponse {
    let Ok(mut conn) = pool.acquire().await else {
        return (StatusCode::INTERNAL_SERVER_ERROR, "Database connection error").into_response();
    };

    let Ok(products) = fetch_products(&mut conn).await else {
        return (StatusCode::INTERNAL_SERVER_ERROR, "Error fetching products").into_response();
    };

    let Ok(stores) = fetch_stores(&mut conn).await else {
        return (StatusCode::INTERNAL_SERVER_ERROR, "Error fetching stores").into_response();
    };

    let full_export = FullExport {
        stores: stores.clone(),
        products: products.clone(),
    };

    let mut buf = Vec::new();
    if create_zip_archive(&mut buf, &full_export, &stores, &products).is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, "Error creating ZIP file").into_response();
    }

    Response::builder()
        .header(header::CONTENT_TYPE, "application/zip")
        .header(header::CONTENT_DISPOSITION, "attachment; filename=\"el-guacal-db.zip\"")
        .body(Body::from(buf))
        .unwrap()
        .into_response()
}

async fn fetch_products(conn: &mut sqlx::PgConnection) -> Result<Vec<ProductExport>, sqlx::Error> {
    let rows = sqlx::query("SELECT product_id, name, brand FROM products")
        .fetch_all(conn)
        .await?;

    Ok(rows
        .into_iter()
        .map(|row| ProductExport {
            product_id: row.get("product_id"),
            name: row.get("name"),
            brand: row.get("brand"),
        })
        .collect())
}

async fn fetch_stores(conn: &mut sqlx::PgConnection) -> Result<Vec<StoreExport>, sqlx::Error> {
    let rows = sqlx::query(
        r"
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
        "
    )
    .fetch_all(conn)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| StoreExport {
            store_id: row.get("store_id"),
            name: row.get("name"),
            address: row.get("address"),
            lat: row.get("lat"),
            lng: row.get("lng"),
            product_ids: row.get("product_ids"),
        })
        .collect())
}

fn create_zip_archive(
    buf: &mut Vec<u8>,
    full_export: &FullExport,
    stores: &[StoreExport],
    products: &[ProductExport],
) -> Result<(), Box<dyn std::error::Error>> {
    let mut zip = ZipWriter::new(Cursor::new(buf));
    let options = SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o644);

    zip.start_file("data.json", options)?;
    serde_json::to_writer(&mut zip, full_export)?;

    zip.start_file("stores.csv", options)?;
    let mut csv_writer = Writer::from_writer(&mut zip);
    for store in stores {
        csv_writer.serialize(store)?;
    }
    csv_writer.flush()?;
    drop(csv_writer);

    zip.start_file("products.csv", options)?;
    let mut csv_writer = Writer::from_writer(&mut zip);
    for product in products {
        csv_writer.serialize(product)?;
    }
    csv_writer.flush()?;
    drop(csv_writer);

    zip.finish()?;
    Ok(())
}
