use spacetimedb::{reducer, table, Identity, ReducerContext, Table, Timestamp, SpacetimeType};

#[table(name = user, public)]
pub struct User {
    #[primary_key]
    identity: Identity,
    name: Option<String>,
    online: bool,
}

#[derive(Debug, Clone, PartialEq, SpacetimeType)]
pub enum Role {
    Bear,
    Skinner,
}

#[table(name = lobby, public)]
pub struct Lobby {
    #[primary_key]
    code: String,
    host: Option<Identity>,
    guest: Option<Identity>,
    host_role: Option<Role>,
    guest_role: Option<Role>,
    created: Timestamp,
    host_ready: bool,
    guest_ready: bool,
    started: bool,
    song_id: Option<String>,
    host_score: u32,
    guest_score: u32,
}

#[reducer]
pub fn create_lobby(ctx: &ReducerContext, code: String, host_role: Role) -> Result<(), String> {
    if ctx.db.lobby().code().find(&code).is_some() {
        return Err("Lobby code already exists".into());
    }
    ctx.db.lobby().insert(Lobby {
        code: code,
        host: Some(ctx.sender),
        guest: None,
        host_role: Some(host_role),
        guest_role: None,
        created: ctx.timestamp,
        host_ready: false,
        guest_ready: false,
        started: false,
        song_id: None,
        host_score: 0,
        guest_score: 0,
    });
    Ok(())
}

#[reducer]
pub fn join_lobby(ctx: &ReducerContext, code: String) -> Result<(), String> {
    if let Some(lobby) = ctx.db.lobby().code().find(&code) {
        if lobby.host == Some(ctx.sender) || lobby.guest == Some(ctx.sender) {
            return Ok(());
        }
        if lobby.guest.is_none() {
            ctx.db.lobby().code().update(Lobby { guest: Some(ctx.sender), ..lobby});
            Ok(())
        } else {
            Err("Lobby is full".into())
        }
    } else {
        Err("Lobby not found".into())
    }
}

#[reducer]
pub fn set_ready(ctx: &ReducerContext, code: String, ready: bool) -> Result<(), String> {
    if let Some(lobby) = ctx.db.lobby().code().find(&code) {
        let (new_host_ready, new_guest_ready) = if lobby.host == Some(ctx.sender) {
            (ready, lobby.guest_ready)
        } else if lobby.guest == Some(ctx.sender) {
            (lobby.host_ready, ready)
        } else {
            return Err("You are not part of this lobby".into());
        };

        let should_start = new_host_ready && new_guest_ready && lobby.song_id.is_some();

        ctx.db.lobby().code().update(Lobby {
            host_ready: new_host_ready,
            guest_ready: new_guest_ready,
            started: should_start,
            ..lobby
        });
        Ok(())
    } else {
        Err("Lobby not found".into())
    }
}

#[reducer]
pub fn set_song(ctx: &ReducerContext, code: String, song_id: String) -> Result<(), String> {
    if song_id.trim().is_empty() {
        return Err("Song ID must not be empty".into());
    }
    if let Some(lobby) = ctx.db.lobby().code().find(&code) {
        ctx.db.lobby().code().update(Lobby {
            song_id: Some(song_id),
            started: false,
            host_score: 0,
            guest_score: 0,
            ..lobby
        });
        Ok(())
    } else {
        Err("Lobby not found".into())
    }
}

#[reducer]
pub fn start_match(ctx: &ReducerContext, code: String) -> Result<(), String> {
    if let Some(lobby) = ctx.db.lobby().code().find(&code) {
        if lobby.guest == Some(ctx.sender) || lobby.host == Some(ctx.sender) {
            if lobby.host_ready && lobby.guest_ready && lobby.song_id.is_some() {
                ctx.db.lobby().code().update(Lobby {
                    started: true,
                    host_score: 0,
                    guest_score: 0,
                    ..lobby
                });
                Ok(())
            } else {
                Err("Both players must be ready and a song selected".into())
            }
        } else {
            Err("You are not part of this lobby".into())
        }
    } else {
        Err("Lobby not found".into())
    }
}

#[reducer]
pub fn set_score(ctx: &ReducerContext, code: String, score: u32) -> Result<(), String> {
    if let Some(lobby) = ctx.db.lobby().code().find(&code) {
        if lobby.host == Some(ctx.sender) {
            ctx.db.lobby().code().update(Lobby {
                host_score: score,
                ..lobby
            });
            Ok(())
        } else if lobby.guest == Some(ctx.sender) {
            ctx.db.lobby().code().update(Lobby {
                guest_score: score,
                ..lobby
            });
            Ok(())
        } else {
            Err("You are not a member of this lobby".into())
        }
    } else {
        Err("Lobby not found".into())
    }
}

#[reducer(client_connected)]
pub fn client_connected(ctx: &ReducerContext) {
    if let Some(user) = ctx.db.user().identity().find(ctx.sender) {
        ctx.db.user().identity().update(User { online: true, ..user });
    } else {
        ctx.db.user().insert(User { name: None, identity: ctx.sender, online: true });
    }
}

#[reducer(client_disconnected)]
pub fn client_disconnected(ctx: &ReducerContext) {
    if let Some(user) = ctx.db.user().identity().find(ctx.sender) {
        ctx.db.user().identity().update(User { online: false, ..user });
    }
}