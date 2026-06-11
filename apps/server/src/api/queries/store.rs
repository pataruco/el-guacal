use crate::model::location::Location;
use crate::model::store::Store;
use async_graphql::{Context, Enum, InputObject, Object};
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Default)]
pub struct StoreQuery;

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum Radius {
    #[graphql(name = "ZOOM_1")]
    Zoom1,
    #[graphql(name = "ZOOM_2")]
    Zoom2,
    #[graphql(name = "ZOOM_3")]
    Zoom3,
    #[graphql(name = "ZOOM_4")]
    Zoom4,
    #[graphql(name = "ZOOM_5")]
    Zoom5,
    #[graphql(name = "ZOOM_6")]
    Zoom6,
    #[graphql(name = "ZOOM_7")]
    Zoom7,
    #[graphql(name = "ZOOM_8")]
    Zoom8,
    #[graphql(name = "ZOOM_9")]
    Zoom9,
    #[graphql(name = "ZOOM_10")]
    Zoom10,
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
            Self::Zoom1 => 1.0,
            Self::Zoom2 => 2.0,
            Self::Zoom3 => 3.0,
            Self::Zoom4 => 4.0,
            Self::Zoom5 => 5.0,
            Self::Zoom6 => 6.0,
            Self::Zoom7 => 7.0,
            Self::Zoom8 => 8.0,
            Self::Zoom9 => 9.0,
            Self::Zoom10 => 10.0,
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

        // Web Mercator resolution formula: converts a map zoom level to meters-per-pixel.
        // 156_543.03392 = Earth's circumference (40_075_016.686m) / 256px (one tile at zoom 0).
        // cos(lat) corrects for Mercator distortion at higher latitudes.
        // 2^zoom halves the resolution per zoom level.
        // Multiplied by 1280px (viewport width) to get the search radius in meters.
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
impl StoreQuery {
    async fn stores_near(
        &self,
        ctx: &Context<'_>,
        location: LocationInput,
        radius: Radius,
        product_ids: Option<Vec<Uuid>>,
    ) -> async_graphql::Result<Vec<Store>> {
        let pool = ctx.data::<PgPool>()?;
        let radius_meters = radius.to_meters(location.lat);

        let product_ids = product_ids.filter(|ids| !ids.is_empty());

        let rows = sqlx::query(
            r"
            SELECT
                store_id,
                name,
                address,
                ST_Y(location::geometry) as lat,
                ST_X(location::geometry) as lng,
                version,
                created_at,
                updated_at
            FROM stores s
            WHERE ST_DWithin(
                location,
                ST_SetSRID(ST_Point($1, $2), 4326)::geography,
                $3
            )
            AND ($4::uuid[] IS NULL OR (
                SELECT COUNT(*)
                FROM store_products sp
                WHERE sp.store_id = s.store_id AND sp.product_id = ANY($4)
            ) = array_length($4, 1))
            ",
        )
        .bind(location.lng)
        .bind(location.lat)
        .bind(radius_meters)
        .bind(product_ids)
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
                    version: row.get::<i64, _>("version"),
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
                version,
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
                version: row.get::<i64, _>("version"),
                created_at: row.get::<DateTime<Utc>, _>("created_at"),
                updated_at: row.get::<DateTime<Utc>, _>("updated_at"),
            }
        }))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const LONDON_LAT: f64 = 51.462_223_3;
    const EARTH_CIRCUMFERENCE_M: f64 = 40_075_017.0;

    fn ordered_radii() -> [(Radius, u32); 22] {
        [
            (Radius::Zoom1, 1),
            (Radius::Zoom2, 2),
            (Radius::Zoom3, 3),
            (Radius::Zoom4, 4),
            (Radius::Zoom5, 5),
            (Radius::Zoom6, 6),
            (Radius::Zoom7, 7),
            (Radius::Zoom8, 8),
            (Radius::Zoom9, 9),
            (Radius::Zoom10, 10),
            (Radius::Zoom11, 11),
            (Radius::Zoom12, 12),
            (Radius::Zoom13, 13),
            (Radius::Zoom14, 14),
            (Radius::Zoom15, 15),
            (Radius::Zoom16, 16),
            (Radius::Zoom17, 17),
            (Radius::Zoom18, 18),
            (Radius::Zoom19, 19),
            (Radius::Zoom20, 20),
            (Radius::Zoom21, 21),
            (Radius::Zoom22, 22),
        ]
    }

    #[test]
    fn each_zoom_step_halves_the_radius() {
        // Web Mercator property: meters_per_pixel ∝ 1 / 2^zoom. This catches
        // mapping foot-guns like `Self::Zoom2 => 20.0`.
        let radii = ordered_radii();
        for pair in radii.windows(2) {
            let lower = pair[0].0.to_meters(LONDON_LAT);
            let higher = pair[1].0.to_meters(LONDON_LAT);
            let ratio = lower / higher;
            assert!(
                (ratio - 2.0).abs() < 1e-9,
                "expected ratio ~2.0 between zoom {} and {}, got {ratio}",
                pair[0].1,
                pair[1].1
            );
        }
    }

    #[test]
    fn zoom_one_exceeds_earth_circumference() {
        // At z=1 the radius exceeds Earth's circumference at every latitude, so
        // PostGIS effectively returns every store regardless of search centre.
        assert!(Radius::Zoom1.to_meters(0.0) > EARTH_CIRCUMFERENCE_M);
        assert!(Radius::Zoom1.to_meters(LONDON_LAT) > EARTH_CIRCUMFERENCE_M);
    }

    #[test]
    fn radius_shrinks_at_higher_latitudes() {
        let equator = Radius::Zoom5.to_meters(0.0);
        let london = Radius::Zoom5.to_meters(LONDON_LAT);
        let arctic = Radius::Zoom5.to_meters(80.0);
        assert!(equator > london);
        assert!(london > arctic);
    }

    #[test]
    fn known_values_at_london() {
        let z11 = Radius::Zoom11.to_meters(LONDON_LAT);
        assert!(z11 > 60_000.0 && z11 < 65_000.0, "z=11 at London: {z11} m");

        let z2 = Radius::Zoom2.to_meters(LONDON_LAT);
        assert!(
            z2 > 30_000_000.0 && z2 < 35_000_000.0,
            "z=2 at London: {z2} m"
        );
    }
}
