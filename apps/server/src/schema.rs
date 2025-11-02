// @generated automatically by Diesel CLI.

pub mod sql_types {
    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "geography"))]
    pub struct Geography;
}

diesel::table! {
    use postgis_diesel::sql_types::*;
    use diesel::sql_types::*;

    products (product_id) {
        product_id -> Uuid,
        #[max_length = 255]
        name -> Varchar,
        #[max_length = 255]
        brand -> Varchar,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    use postgis_diesel::sql_types::*;
    use diesel::sql_types::*;

    spatial_ref_sys (srid) {
        srid -> Int4,
        #[max_length = 256]
        auth_name -> Nullable<Varchar>,
        auth_srid -> Nullable<Int4>,
        #[max_length = 2048]
        srtext -> Nullable<Varchar>,
        #[max_length = 2048]
        proj4text -> Nullable<Varchar>,
    }
}

diesel::table! {
    use postgis_diesel::sql_types::*;
    use diesel::sql_types::*;

    store_products (store_id, product_id) {
        store_id -> Uuid,
        product_id -> Uuid,
    }
}

diesel::table! {
    use postgis_diesel::sql_types::*;
    use super::sql_types::Geography;
    use diesel::sql_types::*;

    stores (store_id) {
        store_id -> Uuid,
        location -> Geography,
        #[max_length = 255]
        name -> Varchar,
        address -> Text,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::joinable!(store_products -> products (product_id));
diesel::joinable!(store_products -> stores (store_id));

diesel::allow_tables_to_appear_in_same_query!(products, spatial_ref_sys, store_products, stores,);
