drop schema if exists ccca cascade;

create schema ccca;

create table ccca.account (
	account_id uuid,
	name text,
	email text,
	document text,
	password text,
	primary key (account_id)
);


create table ccca.account_asset (
	account_id uuid,
	asset_id text,
	quantity numeric,
	primary key (account_id,asset_id)
);

create table ccca.order(
	order_id uuid,
	market_id text,
	account_id uuid,
	side text,
	quantity numeric,
	price numeric,
	fill_quantity numeric,
	fill_price numeric,
	status text,
	timestamp timestamptz,
	primary key (order_id)
);
