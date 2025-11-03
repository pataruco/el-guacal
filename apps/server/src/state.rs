use diesel::{
    PgConnection,
    r2d2::{ConnectionManager, Pool},
};

#[derive(Clone)]
pub struct AppState {
    pub pool: Pool<ConnectionManager<PgConnection>>,
}
