-- Ferrozap — seed inicial de fabricantes e modelos
-- Fonte das marcas: API pública Parallelum/FIPE (fipe.parallelum.com.br),
-- lista COMPLETA (não curada) — decisão consciente: donos de carros
-- raros/extintos são justamente quem mais depende de desmonte para
-- achar peça, cortar essas marcas prejudicaria quem mais precisa do
-- Ferrozap. Nomes normalizados para o que o consumidor usa no dia a
-- dia (ex: "VW - VolksWagen" -> "Volkswagen").
--
-- Os modelos continuam curados manualmente (ver nota abaixo) — o
-- gargalo de cobertura de modelo é resolvido no produto por um campo
-- de texto livre no cadastro/busca, não por importação em massa.
--
-- Rode isso no SQL Editor do Supabase depois do schema.sql.

-- ============================================================
-- Fabricantes — lista completa (106 marcas, normalizadas a partir
-- ============================================================

INSERT INTO fabricantes (nome) VALUES
  ('AM Gen'), ('Aston Martin'), ('Acura'), ('Agrale'), ('Alfa Romeo'),
  ('Asia Motors'), ('Audi'), ('BMW'), ('BRM'), ('BYD'), ('Baby'),
  ('Bugre'), ('CAB Motors'), ('CBT Jipe'), ('Chana'), ('Changan'),
  ('Cadillac'), ('Caoa Changan'), ('Caoa Chery'), ('Chrysler'),
  ('Citroën'), ('Cross Lander'), ('D2D Motors'), ('DFSK'), ('Daewoo'),
  ('Daihatsu'), ('Denza'), ('Dodge'), ('EFFA'), ('Engesa'), ('Envemo'),
  ('Fever'), ('Foton'), ('Ferrari'), ('Fiat'), ('Fibravan'), ('Ford'),
  ('Fyber'), ('GAC'), ('Geely'), ('Chevrolet'), ('Great Wall'),
  ('GWM'), ('Gurgel'), ('Hafei'), ('Hitech Electric'), ('Honda'),
  ('Hyundai'), ('Iveco'), ('Isuzu'), ('JAC'), ('Jinbei'), ('JPX'),
  ('Jaecoo'), ('Jaguar'), ('Jeep'), ('Jetour'), ('Kia'), ('Lamborghini'),
  ('Lifan'), ('Lobini'), ('Lada'), ('Land Rover'), ('Leapmotor'),
  ('Lexus'), ('Lotus'), ('MG'), ('Mini'), ('Mahindra'), ('Maserati'),
  ('Matra'), ('Mazda'), ('Mclaren'), ('Mercedes-Benz'), ('Mercury'),
  ('Mitsubishi'), ('Miura'), ('Neta'), ('Nissan'), ('Omoda'),
  ('Peugeot'), ('Plymouth'), ('Pontiac'), ('Porsche'), ('RAM'),
  ('Rely'), ('Renault'), ('Rolls-Royce'), ('Rover'), ('Seres'),
  ('Shineray'), ('SsangYong'), ('Saab'), ('Saturn'), ('Seat'),
  ('Subaru'), ('Suzuki'), ('TAC'), ('Toyota'), ('Troller'),
  ('Volkswagen'), ('Volvo'), ('Wake'), ('Walk'), ('Willys'), ('Zeekr'), ('smart')
ON CONFLICT (nome) DO NOTHING;

-- ============================================================
-- Modelos mais comuns em desmonte (curadoria manual)
-- ============================================================

INSERT INTO modelos (fabricante_id, nome, tem_submodelo_relevante) VALUES
  -- Volkswagen
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Gol', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Voyage', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Fox', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Saveiro', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Polo', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'T-Cross', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Jetta', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Virtus', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Nivus', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Amarok', true),
  -- Chevrolet
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'Onix', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'Celta', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'Prisma', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'Tracker', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'S10', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'Spin', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'Cruze', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'Cobalt', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'Montana', false),
  -- Fiat
  ((SELECT id FROM fabricantes WHERE nome = 'Fiat'), 'Uno', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Fiat'), 'Palio', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Fiat'), 'Argo', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Fiat'), 'Strada', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Fiat'), 'Mobi', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Fiat'), 'Toro', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Fiat'), 'Cronos', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Fiat'), 'Fiorino', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Fiat'), 'Doblo', false),
  -- Ford
  ((SELECT id FROM fabricantes WHERE nome = 'Ford'), 'Ka', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Ford'), 'Fiesta', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Ford'), 'EcoSport', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Ford'), 'Ranger', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Ford'), 'Focus', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Ford'), 'Territory', false),
  -- Toyota
  ((SELECT id FROM fabricantes WHERE nome = 'Toyota'), 'Corolla', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Toyota'), 'Hilux', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Toyota'), 'Etios', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Toyota'), 'Yaris', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Toyota'), 'RAV4', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Toyota'), 'SW4', false),
  -- Honda
  ((SELECT id FROM fabricantes WHERE nome = 'Honda'), 'Civic', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Honda'), 'Fit', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Honda'), 'HR-V', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Honda'), 'City', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Honda'), 'CR-V', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Honda'), 'WR-V', false),
  -- Hyundai
  ((SELECT id FROM fabricantes WHERE nome = 'Hyundai'), 'HB20', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Hyundai'), 'Creta', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Hyundai'), 'HB20S', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Hyundai'), 'i30', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Hyundai'), 'Tucson', false),
  -- Renault
  ((SELECT id FROM fabricantes WHERE nome = 'Renault'), 'Sandero', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Renault'), 'Logan', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Renault'), 'Kwid', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Renault'), 'Duster', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Renault'), 'Captur', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Renault'), 'Oroch', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Renault'), 'Fluence', false),
  -- Jeep
  ((SELECT id FROM fabricantes WHERE nome = 'Jeep'), 'Renegade', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Jeep'), 'Compass', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Jeep'), 'Commander', false),
  -- Nissan
  ((SELECT id FROM fabricantes WHERE nome = 'Nissan'), 'Kicks', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Nissan'), 'March', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Nissan'), 'Versa', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Nissan'), 'Sentra', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Nissan'), 'Frontier', true),
  -- Peugeot
  ((SELECT id FROM fabricantes WHERE nome = 'Peugeot'), '208', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Peugeot'), '2008', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Peugeot'), '3008', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Peugeot'), 'Partner', false),
  -- Citroën (lista completa, conferida contra catálogo do Webmotors)
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'Aircross', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'AX', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'Basalt', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'C3', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'C3 Aircross', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'C3 Picasso', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'C3 Sonora', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'C4', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'C4 Cactus', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'C4 Grand Picasso', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'C4 Lounge', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'C4 Picasso', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'C5', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'C6', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'DS3', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'DS4', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'DS5', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'Evasion', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'Grand C4', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'Jumper', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'Jumpy', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'Xsara', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'Xsara Picasso', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Citroën'), 'ZX', false),
  -- Kia
  ((SELECT id FROM fabricantes WHERE nome = 'Kia'), 'Sportage', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Kia'), 'Cerato', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Kia'), 'Picanto', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Kia'), 'Soul', false),
  -- Mitsubishi
  ((SELECT id FROM fabricantes WHERE nome = 'Mitsubishi'), 'L200 Triton', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Mitsubishi'), 'Pajero Sport', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Mitsubishi'), 'ASX', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Mitsubishi'), 'Outlander', false),
  -- BMW
  ((SELECT id FROM fabricantes WHERE nome = 'BMW'), '320i', false),
  ((SELECT id FROM fabricantes WHERE nome = 'BMW'), 'X1', false),
  ((SELECT id FROM fabricantes WHERE nome = 'BMW'), 'X3', false),
  ((SELECT id FROM fabricantes WHERE nome = 'BMW'), '118i', false),
  -- Mercedes-Benz
  ((SELECT id FROM fabricantes WHERE nome = 'Mercedes-Benz'), 'Classe C', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Mercedes-Benz'), 'GLA', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Mercedes-Benz'), 'Classe A', false),
  -- Audi
  ((SELECT id FROM fabricantes WHERE nome = 'Audi'), 'A3', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Audi'), 'A4', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Audi'), 'Q3', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Audi'), 'Q5', false),
  -- Volvo
  ((SELECT id FROM fabricantes WHERE nome = 'Volvo'), 'XC60', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Volvo'), 'XC40', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Volvo'), 'S60', false),
  -- Land Rover
  ((SELECT id FROM fabricantes WHERE nome = 'Land Rover'), 'Evoque', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Land Rover'), 'Discovery Sport', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Land Rover'), 'Defender', false),
  -- Suzuki
  ((SELECT id FROM fabricantes WHERE nome = 'Suzuki'), 'Jimny', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Suzuki'), 'Vitara', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Suzuki'), 'S-Cross', false),
  -- Mazda
  ((SELECT id FROM fabricantes WHERE nome = 'Mazda'), 'Mazda3', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Mazda'), 'CX-5', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Mazda'), 'CX-30', false),
  -- Subaru
  ((SELECT id FROM fabricantes WHERE nome = 'Subaru'), 'Impreza', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Subaru'), 'Forester', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Subaru'), 'XV', false),
  -- Caoa Chery
  ((SELECT id FROM fabricantes WHERE nome = 'Caoa Chery'), 'Tiggo 5x', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Caoa Chery'), 'Tiggo 7', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Caoa Chery'), 'QQ', false),
  -- GWM
  ((SELECT id FROM fabricantes WHERE nome = 'GWM'), 'Haval H6', false),
  ((SELECT id FROM fabricantes WHERE nome = 'GWM'), 'Poer', true),
  -- JAC
  ((SELECT id FROM fabricantes WHERE nome = 'JAC'), 'T40', false),
  ((SELECT id FROM fabricantes WHERE nome = 'JAC'), 'T50', false),
  ((SELECT id FROM fabricantes WHERE nome = 'JAC'), 'iEV', false),
  -- RAM
  ((SELECT id FROM fabricantes WHERE nome = 'RAM'), '1500', false),
  ((SELECT id FROM fabricantes WHERE nome = 'RAM'), '2500', false),
  -- Troller
  ((SELECT id FROM fabricantes WHERE nome = 'Troller'), 'T4', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Troller'), 'Pantanal', false),
  -- Volkswagen — clássicos/descontinuados (alto volume real em desmonte)
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Santana', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Parati', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Kombi', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Apollo', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Bora', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Passat', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Up!', false),
  -- Chevrolet — clássicos/descontinuados
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'Corsa', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'Astra', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'Vectra', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'Kadett', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'Monza', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'Chevette', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'Meriva', false),
  -- Fiat — clássicos/descontinuados
  ((SELECT id FROM fabricantes WHERE nome = 'Fiat'), 'Siena', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Fiat'), 'Punto', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Fiat'), 'Tempra', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Fiat'), 'Tipo', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Fiat'), 'Marea', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Fiat'), 'Bravo', false),
  -- Ford — clássicos/descontinuados
  ((SELECT id FROM fabricantes WHERE nome = 'Ford'), 'Escort', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Ford'), 'Del Rey', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Ford'), 'Corcel', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Ford'), 'Verona', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Ford'), 'Belina', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Ford'), 'Pampa', false),
  -- Honda — clássico
  ((SELECT id FROM fabricantes WHERE nome = 'Honda'), 'Accord', false),
  -- Renault — clássicos
  ((SELECT id FROM fabricantes WHERE nome = 'Renault'), 'Clio', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Renault'), 'Megane', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Renault'), 'Scenic', false),
  -- BYD (elétricos/híbridos, volume crescente)
  ((SELECT id FROM fabricantes WHERE nome = 'BYD'), 'Dolphin', false),
  ((SELECT id FROM fabricantes WHERE nome = 'BYD'), 'Song Plus', false),
  ((SELECT id FROM fabricantes WHERE nome = 'BYD'), 'Yuan Plus', false),
  ((SELECT id FROM fabricantes WHERE nome = 'BYD'), 'Han', false),
  -- Lexus
  ((SELECT id FROM fabricantes WHERE nome = 'Lexus'), 'RX', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Lexus'), 'NX', false),
  -- Mini
  ((SELECT id FROM fabricantes WHERE nome = 'Mini'), 'Cooper', false),
  -- Porsche
  ((SELECT id FROM fabricantes WHERE nome = 'Porsche'), '911', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Porsche'), 'Cayenne', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Porsche'), 'Macan', false),
  -- Jaguar
  ((SELECT id FROM fabricantes WHERE nome = 'Jaguar'), 'F-Pace', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Jaguar'), 'XE', false),
  -- Iveco
  ((SELECT id FROM fabricantes WHERE nome = 'Iveco'), 'Daily', false),
  -- Seat (comum em desmonte por ser descontinuada no Brasil)
  ((SELECT id FROM fabricantes WHERE nome = 'Seat'), 'Ibiza', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Seat'), 'Leon', false)
ON CONFLICT (fabricante_id, nome) DO NOTHING;

-- ============================================================
-- Gerações — só os modelos mais icônicos, como ponto de partida.
-- AVISO: anos aproximados, fontes de mercado divergem em datas exatas
-- de corte. Validar antes de confiar 100% (ver docs/decisoes.md).
-- ============================================================

INSERT INTO geracoes (modelo_id, nome, ano_inicio, ano_fim) VALUES
  ((SELECT m.id FROM modelos m JOIN fabricantes f ON f.id = m.fabricante_id
    WHERE f.nome = 'Volkswagen' AND m.nome = 'Gol'), 'G5', 2008, 2013),
  ((SELECT m.id FROM modelos m JOIN fabricantes f ON f.id = m.fabricante_id
    WHERE f.nome = 'Volkswagen' AND m.nome = 'Gol'), 'G6', 2013, 2016),
  ((SELECT m.id FROM modelos m JOIN fabricantes f ON f.id = m.fabricante_id
    WHERE f.nome = 'Volkswagen' AND m.nome = 'Gol'), 'G7', 2016, 2023),
  ((SELECT m.id FROM modelos m JOIN fabricantes f ON f.id = m.fabricante_id
    WHERE f.nome = 'Chevrolet' AND m.nome = 'Onix'), '1a geração', 2012, 2019),
  ((SELECT m.id FROM modelos m JOIN fabricantes f ON f.id = m.fabricante_id
    WHERE f.nome = 'Chevrolet' AND m.nome = 'Onix'), '2a geração', 2019, 2026),
  ((SELECT m.id FROM modelos m JOIN fabricantes f ON f.id = m.fabricante_id
    WHERE f.nome = 'Hyundai' AND m.nome = 'HB20'), '1a geração', 2012, 2019),
  ((SELECT m.id FROM modelos m JOIN fabricantes f ON f.id = m.fabricante_id
    WHERE f.nome = 'Hyundai' AND m.nome = 'HB20'), '2a geração', 2019, 2026)
ON CONFLICT (modelo_id, nome) DO NOTHING;
