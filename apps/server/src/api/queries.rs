use crate::model::location::Location;
use crate::model::store::Store;
use async_graphql::{Context, Enum, InputObject, Object};
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

pub struct Query;

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum Radius {
    #[graphql(name = "ZOOM_11")]
    Zoom11,
    #[graphql(name = "ZOOM_12")]
    Zoom12,
    #[graphql(name = "ZOOM_13")]
    Zoom13,
    #[graphql(name = "ZOOM_14")]
    Zoom14,
    #[graphql(name = "ZOOM_15")]
    Zoom15,
    #[graphql(name = "ZOOM_16")]
    Zoom16,
    #[graphql(name = "ZOOM_17")]
    Zoom17,
    #[graphql(name = "ZOOM_18")]
    Zoom18,
    #[graphql(name = "ZOOM_19")]
    Zoom19,
    #[graphql(name = "ZOOM_20")]
    Zoom20,
    #[graphql(name = "ZOOM_21")]
    Zoom21,
    #[graphql(name = "ZOOM_22")]
    Zoom22,
}

#[allow(clippy::suboptimal_flops)]
impl Radius {
    fn to_meters(self, lat: f64) -> f64 {
        let zoom = match self {
            Self::Zoom11 => 11.0,
            Self::Zoom12 => 12.0,
            Self::Zoom13 => 13.0,
            Self::Zoom14 => 14.0,
            Self::Zoom15 => 15.0,
            Self::Zoom16 => 16.0,
            Self::Zoom17 => 17.0,
            Self::Zoom18 => 18.0,
            Self::Zoom19 => 19.0,
            Self::Zoom20 => 20.0,
            Self::Zoom21 => 21.0,
            Self::Zoom22 => 22.0,
        };

        let meters_per_pixel = (lat.to_radians().cos() * 156_543.033_92) / 2.0_f64.powf(zoom);
        meters_per_pixel * 1280.0
    }
}

#[derive(InputObject)]
pub struct LocationInput {
    pub lat: f64,
    pub lng: f64,
}

#[Object]
impl Query {
    async fn stores_near(
        &self,
        ctx: &Context<'_>,
        location: LocationInput,
        radius: Radius,
    ) -> async_graphql::Result<Vec<Store>> {
        let pool = ctx.data::<PgPool>()?;
        let radius_meters = radius.to_meters(location.lat);

        let rows = sqlx::query(
            r"
            SELECT
                store_id,
                name,
                address,
                ST_Y(location::geometry) as lat,
                ST_X(location::geometry) as lng,
                created_at,
                updated_at
            FROM stores
            WHERE ST_DWithin(
                location,
                ST_SetSRID(ST_Point($1, $2), 4326)::geography,
                $3
            )
            ",
        )
        .bind(location.lng)
        .bind(location.lat)
        .bind(radius_meters)
        .fetch_all(pool)
        .await?;

        let stores = rows
            .into_iter()
            .map(|row| {
                use sqlx::Row;
                Store {
                    store_id: row.get::<Uuid, _>("store_id"),
                    name: row.get::<String, _>("name"),
                    address: row.get::<String, _>("address"),
                    location: Location {
                        lat: row.get::<f64, _>("lat"),
                        lng: row.get::<f64, _>("lng"),
                    },
                    created_at: row.get::<DateTime<Utc>, _>("created_at"),
                    updated_at: row.get::<DateTime<Utc>, _>("updated_at"),
                }
            })
            .collect();

        Ok(stores)
    }

    async fn get_store_by_id(
        &self,
        ctx: &Context<'_>,
        id: Uuid,
    ) -> async_graphql::Result<Option<Store>> {
        let pool = ctx.data::<PgPool>()?;

        let row = sqlx::query(
            r"
            SELECT
                store_id,
                name,
                address,
                ST_Y(location::geometry) as lat,
                ST_X(location::geometry) as lng,
                created_at,
                updated_at
            FROM stores
            WHERE store_id = $1
            ",
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(row.map(|row| {
            use sqlx::Row;
            Store {
                store_id: row.get::<Uuid, _>("store_id"),
                name: row.get::<String, _>("name"),
                address: row.get::<String, _>("address"),
                location: Location {
                    lat: row.get::<f64, _>("lat"),
                    lng: row.get::<f64, _>("lng"),
                },
                created_at: row.get::<DateTime<Utc>, _>("created_at"),
                updated_at: row.get::<DateTime<Utc>, _>("updated_at"),
            }
        }))
    }
}
