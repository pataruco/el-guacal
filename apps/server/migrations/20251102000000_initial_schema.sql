CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    IF (
        NEW IS DISTINCT FROM OLD AND
        NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at
    ) THEN
        NEW.updated_at := current_timestamp;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE stores (
  store_id uuid DEFAULT uuid_generate_v4 (),
  location GEOGRAPHY(Point) NOT NULL,
  name varchar(255) NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (store_id)
);

CREATE TRIGGER set_updated_at_stores BEFORE UPDATE ON stores
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE INDEX stores_gix ON stores USING GIST (location);

CREATE TABLE products (
  product_id uuid DEFAULT uuid_generate_v4 (),
  name varchar(255) NOT NULL,
  brand varchar(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (product_id)
);

CREATE TRIGGER set_updated_at_products BEFORE UPDATE ON products
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TABLE store_products (
  store_id uuid NOT NULL,
  product_id uuid NOT NULL,
  PRIMARY KEY (store_id, product_id),
  FOREIGN KEY (store_id) REFERENCES stores (store_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
);

CREATE INDEX idx_store_products_store_id ON store_products (store_id);
CREATE INDEX idx_store_products_product_id ON store_products (product_id);

INSERT INTO
  stores (location, name, address)
VALUES
  (
    ST_GeographyFromText('POINT(-0.1140086 51.4622233)'),
    'Brixton Market',
    'Electric Avenue Brixton,London SW9 8JX'
  ),
  (
    ST_GeographyFromText('POINT(-2.013798 52.5371813)'),
    'Tesco West Bromwich Extra',
    '46 New St West Bromwich,West Midlands B70 0HW UK'
  ),
  (
    ST_GeographyFromText('POINT(-0.2166409 51.4610877)'),
    'Piccolo Bar',
    'Piccolo Bar 167A Putney High St London SW15 1RT United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.111075 51.5514893)'),
    'El Rincon Quiteno',
    'El Rincon Quiteno 235 Holloway Rd London N7 8HG United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.0799164 51.5371326)'),
    'Arepa & Co',
    '58a De Beauvoir Crescent London N1 5SL United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(0.8960349 51.8961962)'),
    'The Food Station',
    '75 N Station Rd Colchester,Essex CO1 1SB United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(0.8992349 51.8886234)'),
    'La Grocerya',
    'Trinity St Colchester Essex,UK'
  ),
  (
    ST_GeographyFromText('POINT(-0.2190001 51.4614035)'),
    'Jeans Deli/Cafe',
    '236 Upper Richmond Rd London SW15 6TG UK'
  ),
  (
    ST_GeographyFromText('POINT(-0.0553242 51.54907799999999)'),
    'Sun Food',
    '403 Mare St London E8 1HY United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.055416 51.5418479)'),
    'Casa de Carnes',
    '223 Mare Street,Dalston London,E8 3QE'
  ),
  (
    ST_GeographyFromText('POINT(-0.154342 51.6066292)'),
    'Tesco North Finchley',
    'Coppetts Centre N Circular Rd North Finchley,London N12 0SH,United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-2.2472739 53.4824705)'),
    'Las Iguanas (Manchester)',
    '84 Deansgate Manchester M3 2ER,United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-2.1068611 57.15466780000001)'),
    'Spice of Asia',
    '489 George St Aberdeen AB25 1HL United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.0673872 51.47032369999999)'),
    'Rye Lane',
    'Peckham,London SE15'
  ),
  (
    ST_GeographyFromText('POINT(-0.2022038 51.4851635)'),
    'Afro Caribbean Asian Store',
    '323 N End Rd Fulham,London SW6 1NN UK'
  ),
  (
    ST_GeographyFromText('POINT(-0.9708951 51.452648)'),
    'Las Iguanas (Reading)',
    'Las Iguanas 17a Riverside The Oracle Reading RG1 2AG,United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.0988066 51.4933406)'),
    'La Chatica',
    'La Chatica Café 2 Elephant Rd London SE17 1LB United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.1034738 51.59075540000001)'),
    'Latin Stop',
    '4-6 High Rd London N22 6BX United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.0710755 51.5884403)'),
    'Tesco Tottenham',
    '230 High Rd London N15 4AJ United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.5593092000000001 51.3180206)'),
    'Grey Oriental Foods',
    '25A High St Town Centre Woking GU21 6BW,United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-1.8673744 50.7355038)'),
    'Ahmed Foodstore',
    'Ahmed Foodstore 95 Charminster Rd Bournemouth,Dorset BH8 8UH United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-1.8853949 50.7193863)'),
    'Europe Mini Market',
    '6 St Michaels Rd Bournemouth,Dorset BH2 5DX United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.2018996 51.48490839999999)'),
    'Fulham',
    'London SW6 1NN'
  ),
  (
    ST_GeographyFromText('POINT(-0.1312298 51.4249387)'),
    'Tesco Extra Streatham',
    'Tesco Lambeth 384 Streatham High Rd London SW16 6HP'
  ),
  (
    ST_GeographyFromText('POINT(-0.3001732 51.4858681)'),
    'Brentford African Supermarket',
    'African Supermarket Albany Parade High St Brentford TW8 0JW'
  ),
  (
    ST_GeographyFromText('POINT(-0.109852 51.59421529999999)'),
    'Tropical Mini Market',
    'Tropical Mini Market The Mall Wood Green 159 High Rd Wood Green London N22 6YQ'
  ),
  (
    ST_GeographyFromText('POINT(-0.0985045 51.4926021)'),
    'Los Arrieros',
    'Walworth Rd London SE1 6SW'
  ),
  (
    ST_GeographyFromText('POINT(-0.1037034 51.5640365)'),
    'M.k. Super Market',
    '18 Blackstock Rd London N4 2DW'
  ),
  (
    ST_GeographyFromText('POINT(-0.1085163 51.5672151)'),
    'K M Butchers',
    '29 Stroud Green Rd Stroud Green,London N4 3EF'
  ),
  (
    ST_GeographyFromText('POINT(-0.1966907 51.5234839)'),
    'Supermecardo Portugal',
    '396 Harrow Rd London W9 2HU'
  ),
  (
    ST_GeographyFromText('POINT(-2.5762513 51.45953309999999)'),
    'Malik Stores',
    '24 Stapleton Rd Bristol,Avon BS5 0QX United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-2.564396 51.46775)'),
    'Bristol Sweet Mart',
    'Bristol Sweet Mart,St. Marks Rd,Bristol,United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-3.1658766 51.4635816)'),
    'Las Iguanas',
    'Unit 27,Ground Floor Mermaid Quay Cardiff CF10 5BZ,United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.1004748 51.4959129)'),
    'La Bodeguita',
    'La Bodeguita Elephant and Castle London SE1 6TE United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.0462548 51.4945239)'),
    'Tesco',
    'Tesco Surrey Quays Extra Surrey Quays Shopping Centre,Redriff Rd Rotherhithe,London SE16 7LL United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.1345227 51.56518149999999)'),
    'Tahir Halal Meat',
    'Tahir Halal Meat 9 Junction Rd London N19 5QT United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-1.8947076 52.4765524)'),
    'Bullring Markets',
    'Edgbaston St Birmingham B5 4QL United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-1.8869262 52.5126935)'),
    'Tesco Aston Lane Superstore',
    'Tesco Aston Lane Superstore 278-299 Aston Ln Birmingham,West Midlands B6 6QR United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.1166392 51.55919650000001)'),
    'Seven Sisters Greengrocers',
    'Seven Sisters Greengrocers 70 Seven Sisters Rd London N7 6AE United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.254808 51.5547287)'),
    'Wembley Extra',
    'Great Central Way London NW10 0TL United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.4078242 51.4990258)'),
    'Tesco Southall Hayes Bulls Bridge Extra',
    'Bulls Bridge Industrial Estate,Hayes Rd London UB2 5LN United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.9889667 51.4556516)'),
    'Al-Medina Store',
    'Oxford Rd City Centre Reading RG1 7PL,United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.0126262 51.466567)'),
    'Tesco Lewisham Superstore',
    '209 Lewisham Rd Lewisham,London SE13 7PY United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.187998 51.1141644)'),
    'Taj the Grocer',
    '12 Haslett Ave W Town Centre Crawley RH10 1HS,United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.1524802 50.8247152)'),
    'Taj The Grocer',
    '98-99 Western Rd Brighton BN1 2LB United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-3.2033377 55.9412783)'),
    'Lupe Pintos',
    '24 Leven St West End Edinburgh EH3 9LJ,United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.592313 51.510364)'),
    'Tesco Slough Wellington Extra',
    'Brunel Way Wellington St Slough SL1 1XW,United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-1.616507 54.9715049)'),
    'Spanglish Tiendita',
    '30 Newgate St Newcastle upon Tyne NE1 United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(0.1368842 52.2047238)'),
    'All Seasons Food',
    '4 Norfolk St City Centre Cambridge CB1 2LF,United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-1.3920878 50.9261124)'),
    'International Foods Ltd',
    '168-174 Portswood Rd Southampton SO17 2NJ United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-0.2064631 51.5179834)'),
    'R Garcia and Sons',
    '248-250 Portobello Rd London W11 1LL United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-2.9782745 53.4032701)'),
    'Mattas',
    '51 Bold St Liverpool Chinatown Liverpool L1 4EU,United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(-1.5386772 53.7975006)'),
    'Kirkgate Market',
    'irkgate Market 28-34 George St Leeds,West Yorkshire LS2 7HY United Kingdom'
  ),
  (
    ST_GeographyFromText('POINT(1.2967169 52.63478749999999)'),
    'Asian Bazaar',
    '43 Magdalen St,Norwich NR3 1LQ'
  ),
  (
    ST_GeographyFromText('POINT(-1.132782 52.639772)'),
    'Afro Supermarket',
    '87 Gravel St,City Centre,Leicester LE1 3AG'
  ),
  (
    ST_GeographyFromText('POINT(-2.3489169 53.4648611)'),
    'Las Iguanas',
    'The Great Hall,intu Trafford Centre,The Trafford Centre,Manchester M17 8AA'
  ),
  (
    ST_GeographyFromText('POINT(-0.0824015 51.5779122)'),
    'Gurbet',
    '604 Seven Sisters Rd,South Tottenham,London N15 6HT'
  ),
  (
    ST_GeographyFromText('POINT(-2.9663518 56.4619625)'),
    'Mathews Foods',
    '17-19 Gellatly St,Dundee DD1 3DY'
  ),
  (
    ST_GeographyFromText('POINT(-2.9805804 56.4611087)'),
    'Global Grocers & Butchers',
    '9 Guthrie St,Dundee DD1 5DR'
  ),
  (
    ST_GeographyFromText('POINT(0.9140965999999999 51.885434)'),
    'Yawee Foods',
    '8 Barrack St,Colchester,England'
  ),
  (
    ST_GeographyFromText('POINT(-1.5314681 52.2832079)'),
    'Portuguese Flavours',
    '25B Clemens Street Leamington Spa Warwickshire CV31 2DP'
  ),
  (
    ST_GeographyFromText('POINT(-1.5326077 52.29034189999999)'),
    'Bella Cafe',
    '45 Regent Grove,Royal Leamington Spa,Leamington Spa,Warwickshire CV32 4AP'
  ),
  (
    ST_GeographyFromText('POINT(0.117212 52.2101778)'),
    'Las Iguanas',
    'Quayside,Cambridge CB5 8AB'
  ),
  (
    ST_GeographyFromText('POINT(-2.2269376 53.45739409999999)'),
    'Worldwide Foods',
    '401 Great Western St,Manchester M14 4AH'
  ),
  (
    ST_GeographyFromText('POINT(-0.2314703 51.5012897)'),
    'Donde Carlos',
    '143 Goldhawk Rd,London W12 8EN'
  ),
  (
    ST_GeographyFromText('POINT(-2.9667129 56.46358619999999)'),
    'M&T Continental Grocery',
    '26 St Andrews Street,Dundee,DD1 2EX'
  ),
  (
    ST_GeographyFromText('POINT(-0.9658922 51.4468128)'),
    'Pau Brazil',
    '89 Mount Pleasant,Reading,West Berkshire RG1 2TF'
  ),
  (
    ST_GeographyFromText('POINT(-2.0943417 57.15121569999999)'),
    'Aberdeen',
    'Aberdeen City AB24 5AE'
  ),
  (
    ST_GeographyFromText('POINT(-0.275644 51.6139534)'),
    'F Centre',
    '190B Station Rd,Edgware HA8 7AS'
  ),
  (
    ST_GeographyFromText('POINT(-1.7817223 53.6478152)'),
    'Mackinleys Supermarket',
    '12 Byram St,Huddersfield,West Yorkshire HD1 1DR'
  ),
  (
    ST_GeographyFromText('POINT(-3.9383489 56.1202394)'),
    'Sun Wah Mini-Mart',
    '33 Barnton St,Stirling FK8 1HF'
  ),
  (
    ST_GeographyFromText('POINT(-0.2264316 51.5049394)'),
    'International Cash & Carry',
    '160 Shepherds Bush Market,London W12 8DF'
  ),
  (
    ST_GeographyFromText('POINT(-2.8873841 53.2642302)'),
    'Las Iguanas',
    'Unit 3 Coliseum Leisure Park,Cheshire Oaks,Ellesmere Port,Cheshire CH65 9HD'
  );

  -- Insert Harina P.A.N. product
  INSERT INTO products (name, brand)
  VALUES ('Harina P.A.N.', 'Alimentos Polar');

  -- Add Harina P.A.N. to all stores
  INSERT INTO store_products (store_id, product_id)
  SELECT
    s.store_id,
    p.product_id
  FROM stores s
  CROSS JOIN products p
  WHERE p.name = 'Harina P.A.N.' AND p.brand = 'Alimentos Polar';
