use crate::model::location::Location;
use crate::model::store::Store;
use async_graphql::{Context, Enum, InputObject, Object};
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

pub struct Query;

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum Radius {
    #[graphql(name = "KM_1")]
    Km1,
    #[graphql(name = "KM_2")]
    Km2,
    #[graphql(name = "KM_3")]
    Km3,
    #[graphql(name = "KM_5")]
    Km5,
    #[graphql(name = "KM_10")]
    Km10,
}

impl Radius {
    const fn to_meters(self) -> f64 {
        match self {
            Self::Km1 => 1000.0,
            Self::Km2 => 2000.0,
            Self::Km3 => 3000.0,
            Self::Km5 => 5000.0,
            Self::Km10 => 10000.0,
        }
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
        let radius_meters = radius.to_meters();

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
}
