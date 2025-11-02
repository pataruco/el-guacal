// @generated automatically by Diesel CLI.

pub mod sql_types {
    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "geography"))]
    pub struct Geography;
}

diesel::table! {
    use postgis_diesel::sql_types::*;

    products (product_id) {
        product_id -> diesel::sql_types::Uuid,
        #[max_length = 255]
        name -> Varchar,
        #[max_length = 255]
        brand -> Varchar,
        created_at -> diesel::sql_types::Timestamptz,
        updated_at -> diesel::sql_types::Timestamptz,
    }
}

diesel::table! {
    use postgis_diesel::sql_types::*;

    spatial_ref_sys (srid) {
        srid -> Int4,
        #[max_length = 256]
        auth_name -> diesel::sql_types::Nullable<Varchar> ,
        auth_srid -> diesel::sql_types::Nullable<Int4> ,
        #[max_length = 2048]
        srtext -> diesel::sql_types::Nullable<Varchar> ,
        #[max_length = 2048]
        proj4text -> diesel::sql_types::Nullable<Varchar> ,
    }
}

diesel::table! {
    use postgis_diesel::sql_types::*;

    store_products (store_id, product_id) {
        store_id -> diesel::sql_types::Uuid,
        product_id -> diesel::sql_types::Uuid,
    }
}

diesel::table! {
    use postgis_diesel::sql_types::*;
    use super::sql_types::Geography;

    stores (store_id) {
        store_id -> diesel::sql_types::Uuid,
        location -> Geography,
        #[max_length = 255]
        name -> Varchar,
        address -> diesel::sql_types::Text,
        created_at -> diesel::sql_types::Timestamptz,
        updated_at -> diesel::sql_types::Timestamptz,
    }
}

diesel::joinable!(store_products -> products (product_id));
diesel::joinable!(store_products -> stores (store_id));

diesel::allow_tables_to_appear_in_same_query!(products, spatial_ref_sys, store_products, stores,);
