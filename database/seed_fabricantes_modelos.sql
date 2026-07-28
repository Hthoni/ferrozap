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
-- Fabricantes — lista completa (96 marcas da FIPE, normalizadas)
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
  ('Volkswagen'), ('Volvo'), ('Wake'), ('Walk'), ('Zeekr'), ('smart')
ON CONFLICT (nome) DO NOTHING;

-- ============================================================
-- Modelos mais comuns em desmonte (curadoria manual)
-- ============================================================

INSERT INTO modelos (fabricante_id, nome, tem_submodelo_relevante) VALUES
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Gol', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Voyage', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Fox', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Saveiro', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'Polo', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Volkswagen'), 'T-Cross', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'Onix', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'Celta', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'Prisma', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'Tracker', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Chevrolet'), 'S10', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Fiat'), 'Uno', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Fiat'), 'Palio', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Fiat'), 'Argo', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Fiat'), 'Strada', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Fiat'), 'Mobi', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Ford'), 'Ka', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Ford'), 'Fiesta', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Ford'), 'EcoSport', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Toyota'), 'Corolla', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Toyota'), 'Hilux', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Toyota'), 'Etios', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Honda'), 'Civic', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Honda'), 'Fit', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Honda'), 'HR-V', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Hyundai'), 'HB20', true),
  ((SELECT id FROM fabricantes WHERE nome = 'Hyundai'), 'Creta', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Renault'), 'Sandero', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Renault'), 'Logan', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Renault'), 'Kwid', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Renault'), 'Duster', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Jeep'), 'Renegade', false),
  ((SELECT id FROM fabricantes WHERE nome = 'Jeep'), 'Compass', false)
ON CONFLICT (fabricante_id, nome) DO NOTHING;

-- ============================================================
-- Gerações — só os modelos mais icônicos, como ponto de partida.
-- AVISO: anos aproximados, fontes de mercado divergem em datas exatas
-- de corte. Validar antes de confiar 100% (ver docs/decisoes.md).
-- ============================================================

INSERT INTO geracoes (modelo_id, nome, ano_inicio, ano_fim) VALUES
  ((SELECT id FROM modelos m JOIN fabricantes f ON f.id = m.fabricante_id
    WHERE f.nome = 'Volkswagen' AND m.nome = 'Gol'), 'G5', 2008, 2013),
  ((SELECT id FROM modelos m JOIN fabricantes f ON f.id = m.fabricante_id
    WHERE f.nome = 'Volkswagen' AND m.nome = 'Gol'), 'G6', 2013, 2016),
  ((SELECT id FROM modelos m JOIN fabricantes f ON f.id = m.fabricante_id
    WHERE f.nome = 'Volkswagen' AND m.nome = 'Gol'), 'G7', 2016, 2023),
  ((SELECT id FROM modelos m JOIN fabricantes f ON f.id = m.fabricante_id
    WHERE f.nome = 'Chevrolet' AND m.nome = 'Onix'), '1a geração', 2012, 2019),
  ((SELECT id FROM modelos m JOIN fabricantes f ON f.id = m.fabricante_id
    WHERE f.nome = 'Chevrolet' AND m.nome = 'Onix'), '2a geração', 2019, 2026),
  ((SELECT id FROM modelos m JOIN fabricantes f ON f.id = m.fabricante_id
    WHERE f.nome = 'Hyundai' AND m.nome = 'HB20'), '1a geração', 2012, 2019),
  ((SELECT id FROM modelos m JOIN fabricantes f ON f.id = m.fabricante_id
    WHERE f.nome = 'Hyundai' AND m.nome = 'HB20'), '2a geração', 2019, 2026);
