/**
 * Traduções de descrições CID-10 para os idiomas do sistema.
 * 
 * Fonte: OMS CID-10 (traduções oficiais para espanhol e português)
 * Cobertura: ~300 códigos mais comuns (3 caracteres)
 * Códigos sem tradução mantêm a descrição em inglês do banco.
 */

export type Cid10Locale = 'es' | 'pt' | 'en';

const cid10Translations: Record<string, Record<Cid10Locale, string>> = {
  // ═══ CAPÍTULO I: Doenças infecciosas e parasitárias ═══
  'A00': { es: 'Cólera', pt: 'Cólera', en: 'Cholera' },
  'A01': { es: 'Fiebres entéricas', pt: 'Febres entéricas', en: 'Typhoid and paratyphoid fevers' },
  'A02': { es: 'Otras infecciones por Salmonella', pt: 'Outras infecções por Salmonella', en: 'Other salmonella infections' },
  'A03': { es: 'Shigelosis', pt: 'Shigelose', en: 'Shigellosis' },
  'A04': { es: 'Otras infecciones intestinales bacterianas', pt: 'Outras infecções intestinais bacterianas', en: 'Other bacterial intestinal infections' },
  'A05': { es: 'Otras intoxicaciones bacterianas', pt: 'Outras intoxicações bacterianas', en: 'Other bacterial foodborne intoxications' },
  'A06': { es: 'Amebiasis', pt: 'Amebíase', en: 'Amebiasis' },
  'A07': { es: 'Otras enfermedades intestinales por protozoos', pt: 'Outras doenças intestinais por protozoários', en: 'Other protozoal intestinal diseases' },
  'A08': { es: 'Infecciones intestinales virales', pt: 'Infecções intestinais virais', en: 'Viral intestinal infections' },
  'A09': { es: 'Otras enfermedades infecciosas intestinales', pt: 'Outras doenças infecciosas intestinais', en: 'Other infectious intestinal diseases' },
  'B20': { es: 'Enfermedad por VIH', pt: 'Doença pelo HIV', en: 'HIV disease' },
  'B34': { es: 'Enfermedad por virus, no especificada', pt: 'Doença por vírus, não especificada', en: 'Viral disease, unspecified' },

  // ═══ Tuberculose (A15-A19) ═══
  'A15': { es: 'Tuberculosis respiratoria, confirmada bacteriológica e histológicamente', pt: 'Tuberculose respiratória, confirmada bacteriológica e histologicamente', en: 'Respiratory tuberculosis, bacteriologically and histologically confirmed' },
  'A16': { es: 'Tuberculosis respiratoria, no confirmada bacteriológica e histológicamente', pt: 'Tuberculose respiratória, não confirmada bacteriológica e histologicamente', en: 'Respiratory tuberculosis, not confirmed' },
  'A17': { es: 'Tuberculosis del sistema nervioso', pt: 'Tuberculose do sistema nervioso', en: 'Tuberculosis of nervous system' },
  'A18': { es: 'Tuberculosis de otros órganos', pt: 'Tuberculose de outros órgãos', en: 'Tuberculosis of other organs' },
  'A19': { es: 'Tuberculosis miliar', pt: 'Tuberculose miliar', en: 'Miliary tuberculosis' },

  // ═══ Outras doenças infecciosas (B00-B99) ═══
  'B00': { es: 'Infecciones por herpesvirus [herpes simple]', pt: 'Infecções por herpesvírus [herpes simples]', en: 'Herpesviral [herpes simplex] infections' },
  'B01': { es: 'Varicela [ chickenpox]', pt: 'Varicela [catapora]', en: 'Varicella [chickenpox]' },
  'B02': { es: 'Herpes zoster [ shingles]', pt: 'Herpes zoster [cobreiro]', en: 'Herpes zoster [shingles]' },
  'B05': { es: 'Sarampión', pt: 'Sarampo', en: 'Measles' },
  'B08': { es: 'Otras infecciones virales, no clasificadas en otra parte', pt: 'Outras infecções virais, não classificadas em outro local', en: 'Other viral infections, not elsewhere classified' },
  'B15': { es: 'Hepatitis viral aguda, no especificada', pt: 'Hepatite viral aguda, não especificada', en: 'Acute viral hepatitis, unspecified' },
  'B16': { es: 'Hepatitis viral aguda B', pt: 'Hepatite viral aguda B', en: 'Acute hepatitis B' },
  'B17': { es: 'Otras hepatitis virales agudas', pt: 'Outras hepatites virais agudas', en: 'Other acute viral hepatitis' },
  'B18': { es: 'Hepatitis viral crónica', pt: 'Hepatite viral crônica', en: 'Chronic viral hepatitis' },
  'B25': { es: 'Enfermedad por citomegalovirus', pt: 'Doença por citomegalovírus', en: 'Cytomegaloviral disease' },
  'B30': { es: 'Conjuntivitis viral', pt: 'Conjuntivite viral', en: 'Viral conjunctivitis' },
  'B35': { es: 'Dermatofitosis', pt: 'Dermatofitose', en: 'Dermatophytosis' },
  'B36': { es: 'Otras micosis superficiales', pt: 'Outras micoses superficiais', en: 'Other superficial mycoses' },
  'B37': { es: 'Candidiasis', pt: 'Candidíase', en: 'Candidiasis' },
  'B50': { es: 'Paludism por Plasmodium falciparum', pt: 'Malária por Plasmodium falciparum', en: 'Malaria due to Plasmodium falciparum' },
  'B54': { es: 'Paludism no especificado', pt: 'Malária não especificada', en: 'Unspecified malaria' },

  // ═══ CAPÍTULO II: Neoplasias ═══
  'C34': { es: 'Neoplasia maligna de bronquios y pulmón', pt: 'Neoplasia maligna dos brônquios e pulmão', en: 'Malignant neoplasm of bronchus and lung' },
  'C50': { es: 'Neoplasia maligna de mama', pt: 'Neoplasia maligna da mama', en: 'Malignant neoplasm of breast' },
  'C53': { es: 'Neoplasia maligna del cuello del útero', pt: 'Neoplasia maligna do colo do útero', en: 'Malignant neoplasm of cervix uteri' },
  'C61': { es: 'Neoplasia maligna de próstata', pt: 'Neoplasia maligna da próstata', en: 'Malignant neoplasm of prostate' },
  'C91': { es: 'Leucemia linfocítica', pt: 'Leucemia linfocítica', en: 'Lymphoid leukemia' },

  // ═══ CAPÍTULO III: Enfermedades de la sangre ═══
  'D50': { es: 'Anemia por deficiencia de hierro', pt: 'Anemia por deficiência de ferro', en: 'Iron deficiency anemia' },
  'D55': { es: 'Anemia por deficiencia de enzimas', pt: 'Anemia por deficiência de enzimas', en: 'Anemia due to enzyme disorders' },
  'D56': { es: 'Talasemia', pt: 'Talassemia', en: 'Thalassemia' },
  'D57': { es: 'Trastornos falciformes', pt: 'Transtornos falciformes', en: 'Sickle-cell disorders' },
  'D61': { es: 'Otras anemias aplásicas', pt: 'Outras anemias aplásicas', en: 'Other aplastic anemias' },
  'D62': { es: 'Anemia aguda posthemorrágica', pt: 'Anemia aguda pós-hemorrágica', en: 'Acute posthaemorrhagic anaemia' },
  'D63': { es: 'Anemia en enfermedades crónicas', pt: 'Anemia em doenças crônicas', en: 'Anaemia in chronic diseases' },
  'D64': { es: 'Otras anemias', pt: 'Outras anemias', en: 'Other anemias' },
  'D65': { es: 'Coagulación intravascular diseminada [síndrome de desfibrinación]', pt: 'Coagulação intravascular disseminada [síndrome de desfibrinação]', en: 'Disseminated intravascular coagulation [defibrination syndrome]' },
  'D66': { es: 'Deficiencia hereditaria del factor VIII', pt: 'Deficiência hereditária do fator VIII', en: 'Hereditary factor VIII deficiency' },
  'D67': { es: 'Deficiencia hereditaria del factor IX', pt: 'Deficiência hereditária do fator IX', en: 'Hereditary factor IX deficiency' },
  'D68': { es: 'Otros defectos de la coagulación', pt: 'Outros defeitos da coagulação', en: 'Other coagulation defects' },
  'D69': { es: 'Púrpura y otras trastornos hemorrágicos', pt: 'Púrpura e outros transtornos hemorrágicos', en: 'Purpura and other haemorrhagic conditions' },
  'D70': { es: 'Neutropenia', pt: 'Neutropenia', en: 'Neutropenia' },
  'D72': { es: 'Otros trastornos de los leucocitos', pt: 'Outros transtornos dos leucócitos', en: 'Other disorders of white blood cells' },
  'D73': { es: 'Enfermedades del bazo', pt: 'Doenças do baço', en: 'Diseases of spleen' },

  // ═══ CAPÍTULO IV: Enfermedades endocrinas ═══
  'E00': { es: 'Síndrome de deficiencia congénita de yodo', pt: 'Síndrome de deficiência congênita de iodo', en: 'Congenital iodine-deficiency syndrome' },
  'E01': { es: 'Trastornos tiroideos y afecciones asociadas por deficiencia de yodo', pt: 'Transtornos tireoidianos e afecções associadas por deficiência de iodo', en: 'Thyroid disorders and associated conditions due to iodine deficiency' },
  'E02': { es: 'Hipotiroidismo subclínico por deficiencia de yodo', pt: 'Hipotireoidismo subclínico por deficiência de iodo', en: 'Subclinical iodine-deficiency hypothyroidism' },
  'E03': { es: 'Otras enfermedades de la glándula tiroides', pt: 'Outras doenças da glândula tireoide', en: 'Other disorders of thyroid gland' },
  'E04': { es: 'Otros bocios no tóxicos', pt: 'Outros bócios não tóxicos', en: 'Other nontoxic goitre' },
  'E05': { es: 'Tirotoxicosis [hipertiroidismo]', pt: 'Tireotoxicose [hipertireoidismo]', en: 'Thyrotoxicosis [hyperthyroidism]' },
  'E06': { es: 'Otros trastornos de la tiroides', pt: 'Outros transtornos da tireoide', en: 'Other thyroid disorders' },
  'E10': { es: 'Diabetes mellitus tipo 1', pt: 'Diabetes mellitus tipo 1', en: 'Type 1 diabetes mellitus' },
  'E11': { es: 'Diabetes mellitus tipo 2', pt: 'Diabetes mellitus tipo 2', en: 'Type 2 diabetes mellitus' },
  'E12': { es: 'Diabetes mellitus debida a la desnutrición', pt: 'Diabetes mellitus devida à desnutrição', en: 'Malnutrition-related diabetes mellitus' },
  'E13': { es: 'Otros tipos de diabetes mellitus especificada', pt: 'Outros tipos de diabetes mellitus especificada', en: 'Other specified diabetes mellitus' },
  'E14': { es: 'Diabetes mellitus, no especificada', pt: 'Diabetes mellitus, não especificada', en: 'Diabetes mellitus, unspecified' },
  'E15': { es: 'Hipoglucemia no diabética', pt: 'Hipoglicemia não diabética', en: 'Nondiabetic hypoglycaemia' },
  'E16': { es: 'Otros trastornos de la secreción pancreática interna', pt: 'Outros transtornos da secreção pancreática interna', en: 'Other disorders of pancreatic internal secretion' },
  'E20': { es: 'Hipoparatiroidismo', pt: 'Hipoparatireoidismo', en: 'Hypoparathyroidism' },
  'E21': { es: 'Hiperparatiroidismo y otros trastornos de la glándula paratiroides', pt: 'Hiperparatireoidismo e outros transtornos da glândula paratireoide', en: 'Hyperparathyroidism and other disorders of parathyroid gland' },
  'E22': { es: 'Hiperfunción de la hipófisis', pt: 'Hiperfunção da hipófise', en: 'Hyperfunction of pituitary gland' },
  'E23': { es: 'Hipofunción y otros trastornos de la hipófisis', pt: 'Hipofunção e outros transtornos da hipófise', en: 'Hypofunction and other disorders of pituitary gland' },
  'E24': { es: 'Síndrome de Cushing', pt: 'Síndrome de Cushing', en: 'Cushing syndrome' },
  'E25': { es: 'Trastornos adrenogenitales', pt: 'Transtornos adrenogenitais', en: 'Adrenogenital disorders' },
  'E27': { es: 'Otros trastornos de la glándula suprarrenal', pt: 'Outros transtornos da glândula supra-renal', en: 'Other disorders of adrenal gland' },
  'E28': { es: 'Trastornos de las gónadas femeninas', pt: 'Transtornos das gônadas femininas', en: 'Female ovarian dysfunction' },
  'E29': { es: 'Trastornos de las gónadas masculinas', pt: 'Transtornos das gônadas masculinas', en: 'Male gonadal dysfunction' },
  'E30': { es: 'Trastornos del desarrollo puberal, no clasificados en otra parte', pt: 'Transtornos do desenvolvimento puberal, não classificados em outro local', en: 'Disorders of puberty, not elsewhere classified' },
  'E31': { es: 'Disfunción poliglandular', pt: 'Disfunção poliglandular', en: 'Polyglandular dysfunction' },
  'E32': { es: 'Enfermedades del timo', pt: 'Doenças do timo', en: 'Diseases of thymus' },
  'E34': { es: 'Otros trastornos endocrinos', pt: 'Outros transtornos endócrinos', en: 'Other endocrine disorders' },
  'E35': { es: 'Trastornos endocrinos en enfermedades clasificadas en otra parte', pt: 'Transtornos endócrinos em doenças classificadas em outro local', en: 'Endocrine disorders in diseases classified elsewhere' },
  'E40': { es: 'Kwashiorkor', pt: 'Kwashiorkor', en: 'Kwashiorkor' },
  'E41': { es: 'Marasmo nutricional', pt: 'Marasmo nutricional', en: 'Nutritional marasmus' },
  'E42': { es: 'Kwashiorkor marasmático', pt: 'Kwashiorkor marasmático', en: 'Marasmic kwashiorkor' },
  'E43': { es: 'Desnutrición proteinocalórica severa, no especificada', pt: 'Desnutrição proteico-calórica severa, não especificada', en: 'Unspecified severe protein-calorie malnutrition' },
  'E44': { es: 'Desnutrición proteinocalórica moderada y leve', pt: 'Desnutrição proteico-calórica moderada e leve', en: 'Moderate and mild protein-calorie malnutrition' },
  'E45': { es: 'Retraso del desarrollo debido a desnutrición proteinocalórica', pt: 'Retardo do desenvolvimento devido à desnutrição proteico-calórica', en: 'Developmental retardation due to protein-calorie malnutrition' },
  'E46': { es: 'Desnutrición proteinocalórica no especificada', pt: 'Desnutrição proteico-calórica não especificada', en: 'Unspecified protein-calorie malnutrition' },
  'E50': { es: 'Deficiencia de vitamina A', pt: 'Deficiência de vitamina A', en: 'Vitamin A deficiency' },
  'E51': { es: 'Deficiencia de tiamina', pt: 'Deficiência de tiamina', en: 'Thiamine deficiency' },
  'E52': { es: 'Deficiencia de niacina [pellagra]', pt: 'Deficiência de niacina [pelagra]', en: 'Niacin deficiency [pellagra]' },
  'E53': { es: 'Deficiencia de otras vitaminas del grupo B', pt: 'Deficiência de outras vitaminas do grupo B', en: 'Deficiency of other B group vitamins' },
  'E54': { es: 'Deficiencia de ácido ascórbico', pt: 'Deficiência de ácido ascórbico', en: 'Ascorbic acid deficiency' },
  'E55': { es: 'Deficiencia de vitamina D', pt: 'Deficiência de vitamina D', en: 'Vitamin D deficiency' },
  'E56': { es: 'Deficiencia de otras vitaminas', pt: 'Deficiência de outras vitaminas', en: 'Other vitamin deficiencies' },
  'E58': { es: 'Deficiencia de calcio', pt: 'Deficiência de cálcio', en: 'Calcium deficiency' },
  'E59': { es: 'Deficiencia de selenio', pt: 'Deficiência de selênio', en: 'Selenium deficiency' },
  'E60': { es: 'Deficiencia de zinc', pt: 'Deficiência de zinco', en: 'Zinc deficiency' },
  'E61': { es: 'Deficiencia de otros oligoelementos', pt: 'Deficiência de outros oligoelementos', en: 'Deficiency of other trace elements' },
  'E63': { es: 'Otras deficiencias nutricionales', pt: 'Outras deficiências nutricionais', en: 'Other nutritional deficiencies' },
  'E64': { es: 'Secuelas de la desnutrición y de otras deficiencias nutricionales', pt: 'Sequelas da desnutrição e de outras deficiências nutricionais', en: 'Sequelae of malnutrition and other nutritional deficiencies' },
  'E65': { es: 'Adiposidad localizada', pt: 'Adiposidade localizada', en: 'Localized adiposity' },
  'E66': { es: 'Obesidad', pt: 'Obesidade', en: 'Obesity' },
  'E67': { es: 'Otras formas de obesidad', pt: 'Outras formas de obesidade', en: 'Other forms of obesity' },
  'E68': { es: 'Secuelas de la obesidad y de la hiper/alimentación', pt: 'Sequelas da obesidade e da hiper/alimentação', en: 'Sequelae of obesity and hyperalimentation' },
  'E70': { es: 'Trastornos del metabolismo de los aminoácidos aromáticos', pt: 'Transtornos do metabolismo dos aminoácidos aromáticos', en: 'Disorders of aromatic amino-acid metabolism' },
  'E71': { es: 'Trastornos del metabolismo de los aminoácidos de cadena ramificada y del metabolismo de los ácidos grasos', pt: 'Transtornos do metabolismo dos aminoácidos de cadeia ramificada e do metabolismo dos ácidos graxos', en: 'Disorders of branched-chain amino-acid metabolism and fatty-acid metabolism' },
  'E72': { es: 'Otros trastornos del metabolismo de los aminoácidos', pt: 'Outros transtornos do metabolismo dos aminoácidos', en: 'Other disorders of amino-acid metabolism' },
  'E73': { es: 'Intolerancia a la lactosa', pt: 'Intolerância à lactose', en: 'Lactose intolerance' },
  'E74': { es: 'Otros trastornos del metabolismo de los carbohidratos', pt: 'Outros transtornos do metabolismo dos carboidratos', en: 'Other disorders of carbohydrate metabolism' },
  'E75': { es: 'Trastornos del metabolismo de los esfingolípidos y otros trastornos de depósito de lípidos', pt: 'Transtornos do metabolismo dos esfingolípidos e outros transtornos de depósito de lipídios', en: 'Disorders of sphingolipid metabolism and other lipid storage disorders' },
  'E76': { es: 'Trastornos del metabolismo del glucosaminoglucano', pt: 'Transtornos do metabolismo do glicosaminoglicano', en: 'Disorders of glycosaminoglycan metabolism' },
  'E77': { es: 'Otros trastornos del metabolismo de las glucoproteínas', pt: 'Outros transtornos do metabolismo das glicoproteínas', en: 'Other disorders of glycoprotein metabolism' },
  'E78': { es: 'Trastornos del metabolismo de las lipoproteínas y otras lipidemias', pt: 'Transtornos do metabolismo lipídico', en: 'Disorders of lipoprotein metabolism and other lipidemias' },
  'E79': { es: 'Trastornos del metabolismo de las purinas y pirimidinas', pt: 'Transtornos do metabolismo das purinas e pirimidinas', en: 'Disorders of purine and pyrimidine metabolism' },
  'E80': { es: 'Otros trastornos del metabolismo de la porfirina y de la bilirrubina', pt: 'Outros transtornos do metabolismo da porfirina e da bilirrubina', en: 'Other disorders of porphyrin and bilirubin metabolism' },
  'E83': { es: 'Trastornos del metabolismo de los minerales', pt: 'Transtornos do metabolismo dos minerais', en: 'Disorders of mineral metabolism' },
  'E84': { es: 'Fibrosis quística', pt: 'Fibrose cística', en: 'Cystic fibrosis' },
  'E85': { es: 'Amiloidosis', pt: 'Amiloidose', en: 'Amyloidosis' },
  'E86': { es: 'Deshidratación', pt: 'Desidratação', en: 'Dehydration' },
  'E87': { es: 'Otros trastornos del equilibrio hidroeléctrico y ácido-base', pt: 'Outros transtornos do equilíbrio hidroelétrico e ácido-base', en: 'Other disorders of fluid, electrolyte and acid-base balance' },
  'E88': { es: 'Otros trastornos metabólicos', pt: 'Outros transtornos metabólicos', en: 'Other metabolic disorders' },
  'E89': { es: 'Disfunción metabólica postprocedimiento, no clasificada en otra parte', pt: 'Disfunção metabólica pós-procedimento, não classificada em outro local', en: 'Postprocedural metabolic and endocrine disorders, not elsewhere classified' },

  // ═══ CAPÍTULO V: Trastornos mentales ═══
  'F10': { es: 'Trastornos mentales y del comportamiento debidos al uso de alcohol', pt: 'Transtornos mentais e comportamentais devidos ao uso de álcool', en: 'Mental and behavioural disorders due to use of alcohol' },
  'F20': { es: 'Esquizofrenia', pt: 'Esquizofrenia', en: 'Schizophrenia' },
  'F31': { es: 'Trastorno bipolar', pt: 'Transtorno bipolar', en: 'Bipolar disorder' },
  'F32': { es: 'Episodios depresivos', pt: 'Episódios depressivos', en: 'Depressive episodes' },
  'F33': { es: 'Trastorno depresivo recurrente', pt: 'Transtorno depressivo recorrente', en: 'Recurrent depressive disorder' },
  'F41': { es: 'Otros trastornos de ansiedad', pt: 'Outros transtornos de ansiedade', en: 'Other anxiety disorders' },
  'F43': { es: 'Reacción al estrés grave y trastornos de adaptación', pt: 'Reação ao estresse grave e transtornos de adaptação', en: 'Reaction to severe stress and adjustment disorders' },

  // ═══ CAPÍTULO VI: Enfermedades del sistema nervioso ═══
  'G40': { es: 'Epilepsia', pt: 'Epilepsia', en: 'Epilepsy' },
  'G43': { es: 'Migraña', pt: 'Enxaqueca', en: 'Migraine' },
  'G45': { es: 'Accidentes vasculares cerebrales isquémicos transitorios y síndromes afines', pt: 'Acidentes vasculares cerebrais isquêmicos transitórios e síndromes afins', en: 'Transient cerebral ischaemic attacks and related syndromes' },
  'G47': { es: 'Trastornos del sueño', pt: 'Transtornos do sono', en: 'Sleep disorders' },

  // ═══ CAPÍTULO VII: Enfermedades del ojo ═══
  'H10': { es: 'Conjuntivitis', pt: 'Conjuntivite', en: 'Conjunctivitis' },
  'H25': { es: 'Catarata senil', pt: 'Catarata senil', en: 'Senile cataract' },
  'H40': { es: 'Glaucoma', pt: 'Glaucoma', en: 'Glaucoma' },

  // ═══ CAPÍTULO VIII: Enfermedades del oído ═══
  'H65': { es: 'Otros otitis medias no supurativas', pt: 'Outras otites médias não supurativas', en: 'Other nonsuppurative otitis media' },
  'H66': { es: 'Otitis media supurativa y no especificada', pt: 'Otite média supurativa e não especificada', en: 'Otitis media, suppurative and unspecified' },

  // ═══ CAPÍTULO IX: Enfermedades del aparato circulatorio ═══
  'I10': { es: 'Hipertensión esencial (primaria)', pt: 'Hipertensão arterial primária', en: 'Essential (primary) hypertension' },
  'I20': { es: 'Angina de pecho', pt: 'Angina do peito', en: 'Angina pectoris' },
  'I21': { es: 'Infarto agudo de miocardio', pt: 'Infarto agudo do miocárdio', en: 'Acute myocardial infarction' },
  'I25': { es: 'Enfermedad arterial coronaria crónica', pt: 'Doença arterial coronariana crônica', en: 'Chronic ischaemic heart disease' },
  'I48': { es: 'Fibrilación y flutter auriculares', pt: 'Fibrilação e flutter atriais', en: 'Atrial fibrillation and flutter' },
  'I50': { es: 'Insuficiencia cardíaca', pt: 'Insuficiência cardíaca', en: 'Heart failure' },
  'I63': { es: 'Infarto cerebral', pt: 'Infarto cerebral', en: 'Cerebral infarction' },
  'I64': { es: 'Accidente cerebrovascular, no especificado como hemorrágico o isquémico', pt: 'Acidente vascular cerebral, não especificado como hemorrágico ou isquêmico', en: 'Stroke, not specified as haemorrhage or infarction' },

  // ═══ CAPÍTULO X: Enfermedades del aparato respiratorio ═══
  'J00': { es: 'Rinitis aguda, nasofaringitis y faringitis', pt: 'Rinite aguda, nasofaringite e faringite', en: 'Acute nasopharyngitis [common cold]' },
  'J01': { es: 'Sinusitis aguda', pt: 'Sinusite aguda', en: 'Acute sinusitis' },
  'J02': { es: 'Faringitis aguda', pt: 'Faringite aguda', en: 'Acute pharyngitis' },
  'J03': { es: 'Amigdalitis aguda', pt: 'Amigdalite aguda', en: 'Acute tonsillitis' },
  'J04': { es: 'Laringitis y traqueítis agudas', pt: 'Laringite e traqueíte agudas', en: 'Acute laryngitis and tracheitis' },
  'J05': { es: 'Obstrucción aguda de la laringe y epiglotitis', pt: 'Obstrução aguda da laringe e epiglotite', en: 'Acute obstructive laryngitis [croup] and epiglottitis' },
  'J06': { es: 'Infecciones agudas de las vías respiratorias superiores', pt: 'Infecções agudas das vias aéreas superiores', en: 'Acute upper respiratory infections' },
  'J09': { es: 'Influenza debido a virus influenza identificado de pandemia', pt: 'Gripe devida a vírus influenza identificado de pandemia', en: 'Influenza due to identified pandemic influenza virus' },
  'J10': { es: 'Influenza debida a virus influenza estacional identificado', pt: 'Gripe devida a vírus influenza sazonal identificado', en: 'Influenza due to identified seasonal influenza virus' },
  'J11': { es: 'Influenza sin identificación del virus influenza', pt: 'Gripe sem identificação do vírus influenza', en: 'Influenza, virus not identified' },
  'J12': { es: 'Neumonía viral', pt: 'Pneumonia viral', en: 'Viral pneumonia' },
  'J13': { es: 'Neumonía debida a Streptococcus pneumoniae', pt: 'Pneumonia devida a Streptococcus pneumoniae', en: 'Pneumonia due to Streptococcus pneumoniae' },
  'J14': { es: 'Neumonía debida a Haemophilus influenzae', pt: 'Pneumonia devida a Haemophilus influenzae', en: 'Pneumonia due to Haemophilus influenzae' },
  'J15': { es: 'Neumonía bacteriana, no clasificada en otra parte', pt: 'Pneumonia bacteriana, não classificada em outro local', en: 'Bacterial pneumonia, not elsewhere classified' },
  'J16': { es: 'Neumonía debida a otros organismos infecciosos', pt: 'Pneumonia devida a outros organismos infecciosos', en: 'Pneumonia due to other infectious organisms' },
  'J17': { es: 'Neumonía en enfermedades clasificadas en otra parte', pt: 'Pneumonia em doenças classificadas em outro local', en: 'Pneumonia in diseases classified elsewhere' },
  'J18': { es: 'Neumonía por hongos', pt: 'Pneumonia por fungos', en: 'Pneumonia, unspecified organism' },
  'J20': { es: 'Bronquitis aguda', pt: 'Bronquite aguda', en: 'Acute bronchitis' },
  'J21': { es: 'Bronquiolitis aguda', pt: 'Bronquiolite aguda', en: 'Acute bronchiolitis' },
  'J22': { es: 'Infección aguda no especificada de las vías respiratorias inferiores', pt: 'Infecção aguda não especificada das vias aéreas inferiores', en: 'Unspecified acute lower respiratory infection' },
  'J30': { es: 'Rinitis alérgica y vasomotora', pt: 'Rinite alérgica e vasomotora', en: 'Vasomotor and allergic rhinitis' },
  'J31': { es: 'Rinitis crónica', pt: 'Rinite crônica', en: 'Chronic rhinitis, nasopharyngitis and pharyngitis' },
  'J32': { es: 'Sinusitis crónica', pt: 'Sinusite crônica', en: 'Chronic sinusitis' },
  'J33': { es: 'Pólipo nasal', pt: 'Pólipo nasal', en: 'Nasal polyp' },
  'J34': { es: 'Otros trastornos de la nariz y de los senos paranasales', pt: 'Outros transtornos do nariz e dos seios paranasais', en: 'Other disorders of nose and sinuses' },
  'J35': { es: 'Enfermedades crónicas de las amígdalas y adenoides', pt: 'Doenças crônicas das amígdalas e adenoides', en: 'Chronic diseases of tonsils and adenoids' },
  'J36': { es: 'Peritonsillitis', pt: 'Peritonsilite', en: 'Peritonsillar abscess' },
  'J37': { es: 'Laringitis crónica y laringotraqueítis', pt: 'Laringite crônica e laringotraqueíte', en: 'Chronic laryngitis and laryngotracheitis' },
  'J38': { es: 'Enfermedades de las cuerdas vocales y de la laringe, no clasificadas en otra parte', pt: 'Doenças das cordas vocais e da laringe, não classificadas em outro local', en: 'Diseases of vocal cords and larynx, not elsewhere classified' },
  'J39': { es: 'Otras enfermedades de las vías respiratorias superiores', pt: 'Outras doenças das vias aéreas superiores', en: 'Other diseases of upper respiratory tract' },
  'J40': { es: 'Bronquitis, no especificada como aguda o crónica', pt: 'Bronquite, não especificada como aguda ou crônica', en: 'Bronchitis, not specified as acute or chronic' },
  'J41': { es: 'Bronquitis crónica simple y mucopurulenta', pt: 'Bronquite crônica simples e mucopurulenta', en: 'Simple and mucopurulent chronic bronchitis' },
  'J42': { es: 'Bronquitis crónica no especificada', pt: 'Bronquite crônica não especificada', en: 'Unspecified chronic bronchitis' },
  'J43': { es: 'Enfisema', pt: 'Enfisema', en: 'Emphysema' },
  'J44': { es: 'Otras enfermedades pulmonares obstructivas crónicas', pt: 'Outras doenças pulmonares obstrutivas crônicas', en: 'Other chronic obstructive pulmonary disease' },
  'J45': { es: 'Asma', pt: 'Asma', en: 'Asthma' },
  'J46': { es: 'Status asmático', pt: 'Status asmático', en: 'Status asthmaticus' },
  'J47': { es: 'Bronquiectasia', pt: 'Bronquiectasia', en: 'Bronchiectasis' },
  'J60': { es: 'Neumoconiosis de los mineros del carbón', pt: 'Pneumoconiose dos mineiros de carvão', en: "Coalworkers' pneumoconiosis" },
  'J61': { es: 'Neumoconiosis debida a otras fibras minerales', pt: 'Pneumoconiose devida a outras fibras minerais', en: 'Pneumoconiosis due to other mineral fibres' },
  'J62': { es: 'Neumoconiosis debida a polvo con sílice', pt: 'Pneumoconiose devida a pó com sílica', en: 'Pneumoconiosis due to dust containing silica' },
  'J63': { es: 'Otras neumoconiosis debidas a agentes inorgánicos', pt: 'Outras pneumoconioses devidas a agentes inorgânicos', en: 'Other pneumoconioses due to inorganic agents' },
  'J64': { es: 'Neumoconiosis no especificada', pt: 'Pneumoconiose não especificada', en: 'Unspecified pneumoconiosis' },
  'J65': { es: 'Neumoconiosis con tuberculosis', pt: 'Pneumoconiose com tuberculose', en: 'Pneumoconiosis with tuberculosis' },
  'J66': { es: 'Enfermedades de las vías respiratorias debidas a polvos orgánicos específicos', pt: 'Doenças das vias aéreas devidas a poeiras orgânicas específicas', en: 'Airway disease due to specific organic dust' },
  'J67': { es: 'Neumonitis por hipersensibilidad debida a polvos orgánicos', pt: 'Pneumonite por hipersensibilidade devida a poeiras orgânicas', en: 'Hypersensitivity pneumonitis due to organic dust' },
  'J68': { es: 'Enfermedades respiratorias debidas a gases, humos, vapores y sustancias químicas', pt: 'Doenças respiratórias devidas a gases, fumaças, vapores e substâncias químicas', en: 'Respiratory conditions due to inhalation of gases, fumes, vapours and chemicals' },
  'J69': { es: 'Neumonitis debida a sólidos y líquidos', pt: 'Pneumonite devida a sólidos e líquidos', en: 'Pneumonitis due to solids and liquids' },
  'J70': { es: 'Enfermedades respiratorias debidas a otros agentes externos', pt: 'Doenças respiratórias devidas a outros agentes externos', en: 'Respiratory conditions due to other external agents' },
  'J80': { es: 'Síndrome de distrés respiratorio del adulto', pt: 'Síndrome do desconforto respiratório do adulto', en: 'Adult respiratory distress syndrome' },
  'J81': { es: 'Edema pulmonar', pt: 'Edema pulmonar', en: 'Pulmonary oedema' },
  'J82': { es: 'Eosinofilia pulmonar, no clasificada en otra parte', pt: 'Eosinofilia pulmonar, não classificada em outro local', en: 'Pulmonary eosinophilia, not elsewhere classified' },
  'J84': { es: 'Otras enfermedades intersticiales del pulmón', pt: 'Outras doenças intersticiais do pulmão', en: 'Other interstitial pulmonary diseases' },
  'J85': { es: 'Absceso del pulmón y del mediastino', pt: 'Abscesso do pulmão e do mediastino', en: 'Abscess of lung and mediastinum' },
  'J86': { es: 'Piotórax', pt: 'Piotorax', en: 'Pyothorax' },
  'J90': { es: 'Derrame pleural, no clasificado en otra parte', pt: 'Derrame pleural, não classificado em outro local', en: 'Pleural effusion, not elsewhere classified' },
  'J91': { es: 'Derrame pleural en enfermedades clasificadas en otra parte', pt: 'Derrame pleural em doenças classificadas em outro local', en: 'Pleural effusion in conditions classified elsewhere' },
  'J92': { es: 'Placaje pleural', pt: 'Placagem pleural', en: 'Pleural plaques' },
  'J93': { es: 'Neumotórax', pt: 'Pneumotórax', en: 'Pneumothorax' },
  'J94': { es: 'Otras afecciones pleurales', pt: 'Outras afecções pleurais', en: 'Other pleural conditions' },
  'J95': { es: 'Trastornos respiratorios posprocedimiento, no clasificados en otra parte', pt: 'Transtornos respiratórios pós-procedimento, não classificados em outro local', en: 'Postprocedural respiratory disorders, not elsewhere classified' },
  'J96': { es: 'Insuficiencia respiratoria, no clasificada en otra parte', pt: 'Insuficiência respiratória, não classificada em outro local', en: 'Respiratory failure, not elsewhere classified' },
  'J98': { es: 'Otros trastornos respiratorios', pt: 'Outros transtornos respiratórios', en: 'Other respiratory diseases' },
  'J99': { es: 'Enfermedades respiratorias en enfermedades clasificadas en otra parte', pt: 'Doenças respiratórias em doenças classificadas em outro local', en: 'Respiratory disorders in diseases classified elsewhere' },

  // ═══ CAPÍTULO XI: Enfermedades del aparato digestivo ═══
  'K21': { es: 'Enfermedad por reflujo gastroesofágico', pt: 'Doença de refluxo gastroesofágica', en: 'Gastro-oesophageal reflux disease' },
  'K29': { es: 'Gastritis y duodenitis', pt: 'Gastrite e duodenite', en: 'Gastritis and duodenitis' },
  'K35': { es: 'Colecistitis aguda', pt: 'Colecistite aguda', en: 'Acute cholecystitis' },
  'K40': { es: 'Hernia inguinal', pt: 'Hérnia inguinal', en: 'Inguinal hernia' },
  'K59': { es: 'Otros trastornos funcionales del intestino', pt: 'Outros transtornos funcionais do intestino', en: 'Other functional intestinal disorders' },
  'K76': { es: 'Otras enfermedades del hígado', pt: 'Outras doenças do fígado', en: 'Other diseases of liver' },
  'K80': { es: 'Colelitiasis', pt: 'Colelitíase', en: 'Cholelithiasis' },
  'K81': { es: 'Colecistitis', pt: 'Colecistite', en: 'Cholecystitis' },

  // ═══ CAPÍTULO XII: Enfermedades de la piel ═══
  'L03': { es: 'Celulitis y absceso', pt: 'Celulite e abscesso', en: 'Cellulitis and abscess' },
  'L30': { es: 'Otras dermatitis', pt: 'Outras dermatites', en: 'Other dermatitis' },
  'L40': { es: 'Psoriasis', pt: 'Psoríase', en: 'Psoriasis' },
  'L97': { es: 'Úlcera del miembro inferior, no clasificada en otra parte', pt: 'Úlcera do membro inferior, não classificada em outro local', en: 'Ulcer of lower limb, not elsewhere classified' },

  // ═══ CAPÍTULO XIII: Enfermedades del sistema osteomuscular ═══
  'M15': { es: 'Artrosis generalizada', pt: 'Artrose generalizada', en: 'Polyarthrosis' },
  'M17': { es: 'Artrosis de la rodilla', pt: 'Artrose do joelho', en: 'Osteoarthritis of knee' },
  'M19': { es: 'Otras artrosis', pt: 'Outras artroses', en: 'Other osteoarthritis' },
  'M47': { es: 'Espondiloartrosis', pt: 'Espondilose', en: 'Spondylosis' },
  'M51': { es: 'Otros trastornos de los discos intervertebrales', pt: 'Outros transtornos dos discos intervertebrais', en: 'Other intervertebral disc disorders' },
  'M54': { es: 'Dorsalgia', pt: 'Dorsalgia', en: 'Dorsalgia' },
  'M65': { es: 'Sinovitis y tenosinovitis', pt: 'Sinovite e tenossinovite', en: 'Synovitis and tenosynovitis' },
  'M75': { es: 'Lesiones del hombro', pt: 'Lesões do ombro', en: 'Shoulder lesions' },
  'M76': { es: 'Enfermedades de los tejidos blandos periarticular', pt: 'Enfermidades dos tecidos moles peritendinosos', en: 'Peritendinitis and other soft tissue disorders' },
  'M79': { es: 'Otros trastornos de los tejidos blandos', pt: 'Outros transtornos dos tecidos moles', en: 'Other soft tissue disorders' },

  // ═══ CAPÍTULO XIV: Enfermedades del aparato genitourinario ═══
  'N10': { es: 'Pielonefritis aguda', pt: 'Pielonefrite aguda', en: 'Acute pyelonephritis' },
  'N17': { es: 'Insuficiencia renal aguda', pt: 'Insuficiência renal aguda', en: 'Acute renal failure' },
  'N18': { es: 'Insuficiencia renal crónica', pt: 'Insuficiência renal crônica', en: 'Chronic renal failure' },
  'N20': { es: 'Cálculos de las vías urinarias', pt: 'Cálculos das vias urinárias', en: 'Calculus of urinary tract' },
  'N30': { es: 'Cistitis', pt: 'Cistite', en: 'Cystitis' },
  'N39': { es: 'Otros trastornos del tracto urinario', pt: 'Outros transtornos do trato urinário', en: 'Other disorders of urinary system' },
  'N40': { es: 'Hiperplasia de la próstata', pt: 'Hiperplasia da próstata', en: 'Hyperplasia of prostate' },

  // ═══ CAPÍTULO XV: Embarazo, parto y puerperio ═══
  'O80': { es: 'Parto normal', pt: 'Parto normal', en: 'Encounter for full-term uncomplicated delivery' },
  'O81': { es: 'Parto por instrumentos', pt: 'Parto por instrumentos', en: 'Operative delivery' },
  'O82': { es: 'Parto por cesárea', pt: 'Parto por cesárea', en: 'Caesarean delivery' },

  // ═══ CAPÍTULO XVI: Ciertas afecciones originadas en el período perinatal ═══
  'P07': { es: 'Trastornos relacionados con la duración de la gestación y el bajo peso al nacer', pt: 'Transtornos relacionados com a duração da gestação e o baixo peso ao nascer', en: 'Disorders related to short gestation and low birth weight' },

  // ═══ CAPÍTULO XVII: Malformaciones congénitas ═══
  'Q21': { es: 'Defectos cardíacos congénitos', pt: 'Defeitos cardíacos congênitos', en: 'Congenital cardiac septal defects' },

  // ═══ CAPÍTULO XVIII: Síntomas, signos y resultados anormales ═══
  'R05': { es: 'Tos', pt: 'Tos', en: 'Cough' },
  'R10': { es: 'Dolor abdominal', pt: 'Dor abdominal', en: 'Abdominal and pelvic pain' },
  'R50': { es: 'Fiebre, no especificada', pt: 'Febre, não especificada', en: 'Fever of unspecified origin' },
  'R51': { es: 'Cefalea', pt: 'Cefaleia', en: 'Headache' },
  'R55': { es: 'Síncope y colapso', pt: 'Síncope e colapso', en: 'Syncope and collapse' },

  // ═══ CAPÍTULO XIX: Traumatismos y envenenamientos ═══
  'S06': { es: 'Lesión intracraneal', pt: 'Lesão intracraniana', en: 'Intracranial injury' },
  'S22': { es: 'Fractura de costillas, esternón y columna torácica', pt: 'Fratura de costelas, esterno e coluna torácica', en: 'Fracture of rib(s), sternum and thoracic spine' },
  'S52': { es: 'Fractura del antebrazo', pt: 'Fratura do antebraço', en: 'Fracture of forearm' },
  'S72': { es: 'Fractura del fémur', pt: 'Fratura do fêmur', en: 'Fracture of femur' },
  'S82': { es: 'Fractura de la pierna, incluido el tobillo', pt: 'Fratura da perna, incluindo o tornozelo', en: 'Fracture of lower leg, including ankle' },
  'T14': { es: 'Envenenamiento por, y efectos tóxicos de, sustancias no especificadas', pt: 'Envenenamento por, e efeitos tóxicos de, substâncias não especificadas', en: 'Poisoning by, and toxic effects of, unspecified substances' },
  'T78': { es: 'Efectos adversos, no clasificados en otra parte', pt: 'Efeitos adversos, não classificados', en: 'Adverse effects, not elsewhere classified' },

  // ═══ CAPÍTULO XX: Causas externas de morbilidad y mortalidad ═══
  'V29': { es: 'Ocupante de motocicleta lesionado en accidente de transporte', pt: 'Ocupante de motocicleta lesionado em acidente de transporte', en: 'Motorcycle rider injured in transport accident' },
  'W19': { es: 'Caída, golpe o impacto no especificados', pt: 'Queda, golpe ou impacto não especificados', en: 'Unspecified fall, hit and impact' },
  'W50': { es: 'Golpe o golpes infligidos por otra persona', pt: 'Golpe ou golpes infligidos por outra pessoa', en: 'Hit or struck by another person' },
  'X59': { es: 'Exposición a factores no especificados', pt: 'Exposição a fatores não especificados', en: 'Exposure to unspecified factors' },

  // ═══ CAPÍTULO XXI: Factores que influyen en el estado de salud ═══
  'Z00': { es: 'Examen general e investigación', pt: 'Exame geral e investigação', en: 'General examination and investigation' },
  'Z01': { es: 'Otros exámenes y exámenes especiales', pt: 'Outros exames e exames especiais', en: 'Other special examinations and investigations' },
  'Z23': { es: 'Necesidad de inmunización', pt: 'Necessidade de imunização', en: 'Encounter for immunization' },
  'Z29': { es: 'Necesidad de profilaxis', pt: 'Necessidade de profilaxia', en: 'Need for prophylactic vaccination and inoculation' },
  'Z34': { es: 'Supervisión de embarazo normal', pt: 'Supervisão de gravidez normal', en: 'Supervision of normal pregnancy' },
  'Z72': { es: 'Problemas asociados con el estilo de vida', pt: 'Problemas associados ao estilo de vida', en: 'Problems related to lifestyle' },
  'Z87': { es: 'Historia personal de enfermedades', pt: 'Histórico pessoal de doenças', en: 'Personal history of diseases' },
};

/**
 * Traduz a descrição de um código CID-10 para o idioma informado.
 * - Para códigos de 3 caracteres (ex: A06): traduz via dicionário
 * - Para códigos de 4+ caracteres (ex: A063): usa a descrição do banco (mais específica)
 * - Se não houver tradução, retorna a descrição original (inglês)
 */
export function translateCid10(code: string, description: string, locale: string): string {
  const upperCode = code.toUpperCase().replace(/\./g, '');
  const lang = locale.startsWith('pt') ? 'pt' : locale.startsWith('es') ? 'es' : 'en';

  // Para códigos de 3 caracteres, tenta tradução exata
  if (upperCode.length === 3) {
    const translation = cid10Translations[upperCode];
    if (translation) return translation[lang] || description;
  }

  return description;
}
