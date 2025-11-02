-- Your SQL goes here
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table with spatial column
CREATE TABLE stores (
  store_id uuid DEFAULT uuid_generate_v4 (),
  location GEOGRAPHY(Point) NOT NULL,
  name varchar(255) NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (store_id)
);

-- Add a spatial index
CREATE INDEX stores_gix ON stores USING GIST (location);

-- Create table products
CREATE TABLE products (
  product_id uuid DEFAULT uuid_generate_v4 (),
  name varchar(255) NOT NULL,
  brand varchar(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (product_id)
);

-- Create junction table for many-to-many relationship between stores and products
CREATE TABLE store_products (
  store_id uuid NOT NULL,
  product_id uuid NOT NULL,
  PRIMARY KEY (store_id, product_id),
  FOREIGN KEY (store_id) REFERENCES stores (store_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
);

-- Create indexes for the junction table
CREATE INDEX idx_store_products_store_id ON store_products (store_id);
CREATE INDEX idx_store_products_product_id ON store_products (product_id);
