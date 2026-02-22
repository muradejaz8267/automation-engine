// Extracted questions from Step_1.txt
// Skipped questions: 2, 9, 19, 21, 28, 35, 41, 44, 51, 53, 59, 63, 65, 68, 70, 72, 79, 88, 90, 92, 96, 102, 116
const quizQuestions = [
      {
        questionText: 'A 14-year-old boy is brought to the emergency department by his parents because of a 1-month history of intermittent right knee pain that has worsened during the past day. He rates his current pain as a 6 on a 10-point scale and says that it worsens when he walks and lessens when he sits. During the past 2 weeks, he has been walking 1 mile daily in preparation for participation in the school marching band. He has not taken any medications for his pain. He sustained a right tibia and fibula fracture at the age of 8 years after a skateboarding accident, which was treated with internal fixation and casting. He has asthma treated with inhaled budesonide daily and inhaled albuterol as needed. His mother has type 2 diabetes mellitus, and his maternal grandmother has osteoporosis. The patient is 170 cm (5 ft 7 in; 77th percentile) tall and weighs 88 kg (195 lb; >95th percentile); BMI is 31 kg/m2 (98 th percentile). Temperature is 37.0�C (98.6 �F), pulse is 95/min, and blood pressure is 130/80 mm Hg. Physical examination shows hyperpigmented, thickened skin at the nape of the neck. There is tenderness to palpation of the anterior aspect of the right hip and limited range of motion on abduction, internal rotation, and flexion of the right hip. The left hip and knees are nontender; range of motion is full in all directions. The remainder of the examination discloses no abnormalities. Which of the following factors in this patient�s history most increased his risk for developing this condition?',
        options: [
          'BMI',
          'Family history',
          'Medication use',
          'Previous fractures',
          'Recent physical activity'
        ],
        correctOptionIndex: 0
      },

      {
        questionText: 'A 50-year-old man comes to the office because of a 2-month history of increasing daytime somnolence. He has obstructive sleep apnea for which he has only intermittently used a continuous positive airway pressure device. He is 170 cm (5 ft 7 in) tall and weighs 181 kg (400 lb); BMI is 63 kg/m2. His temperature is 37�C (98.6 �F), pulse is 100/min, respirations are 12/min, and blood pressure is 135/80 mm Hg. Physical examination shows a gray-blue tinge to the lips, earlobes, and nail beds. Cardiac examination shows no other abnormalities. Arterial blood gas analysis on room air shows a pH of 7.31, PCO2 of 70 mm Hg, and PO2 of 50 mm Hg. Which of the following additional findings would be most likely in this patient?',
        options: [
          'Decreased serum bicarbonate concentration',
          'Increased hemoglobin concentration',
          'Increased total lung capacity',
          'Left ventricular hypertrophy'
        ],
        correctOptionIndex: 1
      },

      {
        questionText: 'A 32-year-old man comes to the office because of a 1-day history of cough productive of small amounts of blood and a 2-day history of shortness of breath and swelling of his ankles. He also has a 2-week history of progressive fatigue and episodes of dark urine. He has no history of major medical illness and takes no medications. His temperature is 37�C (98.6 �F), pulse is 90/min, respirations are 18/min, and blood pressure is 175/110 mm Hg. Pulse oximetry on room air shows an oxygen saturation of 91%. Diffuse inspiratory crackles are heard over all lung bases. There is 2+ pitting edema of both ankles. Results of laboratory studies are shown: Hemoglobin 8.9 g/dL Hematocrit Serum 27% Urea nitrogen 55 mg/dL Creatinine 2.9 mg/dL Urine RBC 20�40/hpf Urinalysis also shows some dysmorphic RBCs and rare RBC casts. Examination of a kidney biopsy specimen shows crescentic glomerulonephritis and linear deposition of IgG along the glomerular capillaries. This patient most likely has antibodies directed against which of the following antigens?',
        options: [
          'Collagen',
          'Double-stranded DNA',
          'Nucleolar protein',
          'Phospholipid',
          'Proteins in neutrophil cytoplasm'
        ],
        correctOptionIndex: 0
      },

      {
        questionText: 'A 5-year-old girl is brought to the emergency department because of a 2-day history of fever, urinary urgency, and burning pain with urination. She has had four similar episodes during the past year. A diagnosis of urinary tract infection is made. Subsequent renal ultrasonography shows one large U-shaped kidney. Which of the following is the most likely embryologic origin of this patient\'s condition?',
        options: [
          'Failure of the kidneys to rotate 90 degrees medially',
          'Failure of normal kidney ascent',
          'Failure of one ureteric bud to develop normally',
          'Fusion of the inferior poles of the metanephros during ascent'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'A 78-year-old man comes to the office for a follow-up examination. He was discharged from the hospital 1 week ago after being treated for a nontuberculous mycobacterial infection. He started treatment with ciprofloxacin and rifampin at that time. He also has hypertension and underwent placement of a mechanical aortic valve 6 years ago for aortic stenosis. Other current medications are hydrochlorothiazide, lisinopril, and warfarin. His warfarin dose was doubled 4 days ago. He says that he is trying to follow a healthier diet. He drinks two 12-oz beers daily. Results of laboratory studies done 4 days ago and today are shown 4 Days Ago Today Prothrombin time 11 sec (INR=1) 11.2 sec (INR=1.1) Partial thromboplastin time 29 sec 27 sec Which of the following is the most likely cause of this patient\'s laboratory findings?',
        options: [
          'Decreased protein binding',
          'Eradication of gut flora',
          'Increased alcohol intake',
          'Increased vegetable consumption',
          'Induction of cytochrome enzymes'
        ],
        correctOptionIndex: 4
      },

      {
        questionText: 'A 32-year-old man comes to the office because of a 2-week history of fever and throat pain. He is 173 cm (5 ft 8 in) tall and weighs 63 kg (140 lb); BMI is 21 kg/m2. His pulse is 110/min, respirations are 16/min, and blood pressure is 98/68 mm Hg. Physical examination shows scattered 2- to 4-cm lymph nodes in the neck, axillae, and inguinal regions. There is a bilateral tonsillar exudate but no ulcerations. Results of laboratory studies are shown: Hemoglobin 9.6 g/dL Hematocrit 29% Leukocyte count 1500/mm3 Platelet count 60,000/mm3 A heterophile antibody test result is negative. Which of the following is the most likely diagnosis?',
        options: [
          'Epstein-Barr virus infection',
          'Gonococcal pharyngitis',
          'HIV infection',
          'Lymphogranuloma venereum infection',
          'Streptococcal pharyngitis'
        ],
        correctOptionIndex: 2
      },

      {
        questionText: 'A 50-year-old man comes to the office for a follow-up examination. He has a 2-month history of headache and shortness of breath with exertion. He also has hypertension treated with hydrochlorothiazide for the past 2 years. His blood pressure is 180/105 mm Hg. Ophthalmoscopic examination is most likely to show which of the following in this patient?',
        options: [
          'Arteriovenous nicking',
          'Melanocytes in the uvea',
          'Optic neuritis',
          'Posterior subcapsular cataracts',
          'Tractional retinal detachment'
        ],
        correctOptionIndex: 0
      },

      {
        questionText: 'A 51-year-old man with a 10-year history of gastroesophageal reflux and suspected Barrett esophagus comes to the office because his omeprazole dose "doesn\'t work around the Christmas holidays." He states that he prides himself on having a large appetite and "holding his liquor" during the holidays. He currently takes the maximum dose of omeprazole. Which of the following is the most appropriate initial action by the physician?',
        options: [
          'Ask the patient how much he is eating and drinking during the holidays',
          'Explain the hazards of untreated reflux in the presence of Barrett esophagus',
          'Order an upper endoscopy',
          'Refer the patient to a gastroenterologist',
          'Switch the omeprazole to pantoprazole'
        ],
        correctOptionIndex: 0
      },

      {
        questionText: 'A 60-year-old man comes to the office because of weakness, tingling of his hands and feet, irritability, and forgetfulness for 4 months. Physical examination shows pallor, weakness, and spasticity. Deep tendon reflexes are increased. Sensation to vibration is absent in the lower extremities. Laboratory studies show megaloblastic anemia, serum antiparietal cell antibodies, and increased serum concentrations of methylmalonic acid and total homocyst(e)ine. The synthesis of which of the following amino acids is most likely impaired in this patient?',
        options: [
          'Cysteine',
          'Glutamine',
          'Methionine',
          'Phenylalanine',
          'Tyrosine'
        ],
        correctOptionIndex: 2
      },

      {
        questionText: 'A 65-year-old woman comes to the office for a follow-up examination 1 year after she underwent operative resection of the right colon and chemotherapy for stage III colon cancer. She reports fatigue. Physical examination shows no abnormalities. A staging CT scan of the chest and abdomen shows five new 2- to 3-cm masses in the liver and both lungs. This patient\'s cancer most likely spread to the lungs via which of the following structures?',
        options: [
          'Inferior mesenteric vein',
          'Inferior vena cava',
          'Left colic vein',
          'Middle colic artery',
          'Pulmonary vein',
          'Superior mesenteric artery',
          'Superior vena cava'
        ],
        correctOptionIndex: 1
      },

      {
        questionText: 'A 26-year-old man comes to the office because of a 1-week history of increased urinary frequency accompanied by excessive thirst. He says he has been urinating hourly. Physical examination shows no abnormalities. Serum chemistry studies are within the reference ranges. Urine osmolality is 50 mOsmol/kg H2O. After administration of ADH (vasopressin), his urine osmolality is within the reference range. The most likely cause of this patient\'s symptoms is dysfunction of which of the following structures?',
        options: [
          'Anterior pituitary gland',
          'Bowman capsule',
          'Glomerulus',
          'Hypophysial portal system',
          'Loop of Henle',
          'Supraoptic nucleus'
        ],
        correctOptionIndex: 5
      },

      {
        questionText: 'A 52-year-old woman comes to the office because of a 6-month history of intermittent headaches. Sometimes the pain improves when the patient lies down in a quiet room. Her temperature is 37.5�C (99.5�F), pulse is 86/min, respirations are 16/min, and blood pressure is 154/100 mm Hg. The lungs are clear. Cardiac examination shows the point of maximal impulse displaced to the left and occasional skipped beats; there are no murmurs or rubs. There is no S3. Resting electrocardiography shows left axis deviation with R waves greater than 30 mm in leads V5 through V6. Which of the following processes best explains the development of the left ventricular abnormalities in this patient?',
        options: [
          'Excessive accumulation of glycogen',
          'Fibrosis of intraventricular conduction pathways',
          'Increased synthesis of contractile filaments',
          'Misfolding and aggregation of cytoskeletal proteins',
          'Myocyte hyperplasia as a result of induction of embryonic genes'
        ],
        correctOptionIndex: 2
      },

      {
        questionText: 'A 53-year-old man comes to the physician because of a dry scaly rash on his body for the past year. He has had a 15kg (33-lb) weight loss during the past year. He is 178 cm (5 ft 10 in) tall and now weighs 54 kg (120 lb); BMI is 17 kg/m2. His stools have a large volume and float. Which of the following nutrient deficiencies is most likely?',
        options: [
          'Magnesium',
          'Vitamin A',
          'Vitamin B12 (cobalamin)',
          'Vitamin C',
          'Zinc'
        ],
        correctOptionIndex: 1
      },

      {
        questionText: 'Serum LDL-cholesterol concentrations are measured in blood samples collected from 25 healthy volunteers. The data follow a normal distribution. The mean and standard deviation for this group are 130 mg/dL and 25 mg/dL, respectively. The standard error of the mean is 5.0. With a 95% confidence level, the true mean for the population from which this sample was drawn falls within which of the following ranges (in mg/dL)?',
        options: [
          '105-155',
          '120-140',
          '125-135',
          '128-132',
          '129-131'
        ],
        correctOptionIndex: 1
      },

      {
        questionText: 'A 39-year-old man comes to the physician because of a 6-month history of progressive shortness of breath. He has had a cough productive of white sputum for 2 years. He smoked 1 pack of cigarettes daily for 16 years but quit 10 years ago. He is in mild respiratory distress with pursed lips and a barrel chest; he is using the accessory muscles of respiration. Breath sounds are distant and crackles are present in the lower lung fields bilaterally. Pulmonary function tests show a decreased FEV1:FVC ratio, increased residual volume, and decreased diffusion capacity. An x-ray of the chest shows hyperinflation and hypertranslucency of the lower lobes of both lungs. Which of the following is the most likely diagnosis?',
        options: [
          'Asthma',
          'Bronchiectasis',
          'Chronic pulmonary fibrosis',
          'Cystic fibrosis',
          'Emphysema'
        ],
        correctOptionIndex: 4
      },

      {
        questionText: 'Investigators conduct a study that evaluates the effect of finasteride on the incidence of prostate cancer in 500 patients. The investigators recruit an additional 1000 patients for the study. Which of the following effects will this have on the research study?',
        options: [
          'Greater chance of a Type I error',
          'Greater chance of a Type II error',
          'Less chance of a Type I error',
          'Less chance of a Type II error',
          'Impossible to predict'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'A 54-year-old woman comes to the physician because she would like to lose weight. She has been on numerous diets in the past with limited success. Both her parents have type 2 diabetes mellitus. She is 160 cm (5 ft 3 in) tall and weighs 69 kg (152 lb); BMI is 27 kg/m2. Her blood pressure is 140/90 mm Hg. Fasting serum glucose concentration is 102 mg/dL. Compared with a woman of the same age whose weight is normal, which of the following serum abnormalities is most likely in this patient?',
        options: [
          'Decreased cholesterol excretion',
          'Decreased estrone concentration',
          'Decreased leptin concentration',
          'Increased fasting insulin concentration',
          'Increased growth hormone concentration',
          'Increased thyroid-stimulating hormone concentration'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'A previously healthy 33-year-old woman is brought to the emergency department by the Secret Service for stalking the president of the USA for 2 months. She claims to be married to the president\'s twin brother and states that the president just had his twin kidnapped to avoid competition. She speaks rapidly and is difficult to interrupt. Her associations are often loose. She says, "I haven\'t slept for days, but I won\'t even try to sleep until my husband is rescued. God has been instructing me to take over the White House. I can\'t wait to be reunited with my husband. I hear his voice telling me what to do." When asked about drug use, she says she uses only natural substances. She refuses to permit blood or urine tests, saying, "I don\'t have time to wait for the results." Which of the following is the most likely diagnosis?',
        options: [
          'Bipolar disorder, manic, with psychotic features',
          'Brief psychotic disorder',
          'Delusional disorder',
          'Psychotic disorder due to general medical condition (E) Schizophrenia'
        ],
        correctOptionIndex: 0
      },

      {
        questionText: 'In informing a couple that their newborn has Down syndrome, there is a specific, relatively limited amount of information that the consulting physician should give immediately. The rest can be discussed at a later time. Which of the following best explains the purpose of using this approach to disclosure?',
        options: [
          'Allowing the couple\'s primary care physician to discuss most of the information with them',
          'Allowing the parents time to tell other family members',
          'Delaying parental distress until the information is completely disclosed',
          'Disclosing the most important information so that it can be understood as fully as possible',
          'Influencing the parents\' course of action about what is medically most appropriate'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'A 62-year-old man comes to the physician because of a 6-month history of urinary hesitancy and dribbling after urination. He has to urinate two to three times nightly. Physical examination shows a diffusely enlarged, firm, and nontender prostate. Which of the following is most likely to have contributed to the development of this patient\'s condition?',
        options: [
          'Activation of the ?1-adrenergic receptor',
          'Conversion of testosterone to dihydrotestosterone',
          'Conversion of testosterone to estradiol',
          'Inhibition of the ?1-adrenergic receptor',
          'Production of prostate-specific antigen'
        ],
        correctOptionIndex: 1
      },

      {
        questionText: 'A 19-year-old man who is in the US Army is brought to the emergency department 45 minutes after he sustained a knife wound to the right side of his chest during an altercation. He has no history of major medical illness and takes no medications. His temperature is 36.9�C (98.4�F), pulse is 110/min, respirations are 24/min, and blood pressure is 114/76 mm Hg. Pulse oximetry on room air shows an oxygen saturation of 94%. On physical examination, the trachea appears to be shifted to the left. Pulmonary examination of the right chest is most likely to show which of the following findings? Fremitus Percussion Breath Sounds',
        options: [
          'Decreased dull decreased',
          'Decreased hyperresonant decreased',
          'Decreased hyperresonant dull',
          'Increased dull bronchial',
          'Increased dull decreased'
        ],
        correctOptionIndex: 1
      },

      {
        questionText: 'A 34-year-old man comes to the office because of a 1-month history of diarrhea. He has a history of pheochromocytoma treated 2 years ago. His mother is being treated for a tumor of her parathyroid gland. He has no other history of major medical illness and takes no medications. His temperature is 37.0�C (98.6�F), pulse is 84/min, respirations are 10/min, and blood pressure is 120/75 mm Hg. Pulse oximetry on room air shows an oxygen saturation of 97%. Vital signs are within normal limits. Physical examination shows a 3-cm, palpable mass on the right side of the neck. A biopsy specimen of the mass shows a neuroendocrine neoplasm of parafollicular cell origin. The most likely cause of the findings in this patient is a mutation in which of the following types of genes?',
        options: [
          'Cell cycle regulation gene',
          'DNA mismatch repair gene',
          'Metastasis suppressor gene',
          'Proto-oncogene',
          'Tumor suppressor gene'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'A 56-year-old man is brought to the emergency department by his wife 30 minutes after he had severe upper back pain and hoarseness before becoming comatose. He has hypertension treated with hydrochlorothiazide. His temperature is 37�C (98.6�F), pulse is 100/min, and blood pressure is 160/80 mm Hg in the right arm and 100/60 mm Hg in the left arm. Ophthalmologic examination shows ptosis and miosis of the left eye. There is anhidrosis of the left side of the forehead, right hemiplegia, and a decreased left radial pulse. A chest x-ray shows a widened mediastinum. Which of the following conditions is the most likely cause of these findings?',
        options: [
          'Dissection of the aorta distal to the left subclavian artery',
          'Dissection of the aorta extending into the left carotid artery',
          'Dissection of the aorta extending into the left carotid artery and distal aortic arch',
          'Dissection of the proximal aorta extending into the right subclavian artery',
          'Superior sulcus tumor',
          'Thrombus of the left carotid artery'
        ],
        correctOptionIndex: 2
      },

      {
        questionText: 'A 27-year-old woman comes to the emergency department because of a 1-hour history of severe shortness of breath. She has just returned from a cross-country flight. She has a history of borderline hypertension. Her temperature is 36.9�C (98.5�F), pulse is 113/min, respirations are 28/min, and blood pressure is 138/85 mm Hg. Physical examination shows that the right calf has an increased circumference compared with the left calf, and there is tenderness behind the right knee. Which of the following is the most likely underlying cause of this patient\'s condition?',
        options: [
          'Antithrombin III deficiency',
          'Factor V Leiden mutation',
          'Glanzmann thrombasthenia',
          'Protein C deficiency',
          'von Willebrand disease'
        ],
        correctOptionIndex: 1
      },

      {
        questionText: 'A 20-year-old woman is brought to the urgent care center because of a 2-month history of progressive weakness of her arms. She also has a 1-week history of moderate back pain and headache. Her only medication is ibuprofen as needed for pain. Muscle strength is 3/5 in the upper extremities. Sensation to pinprick is decreased over the upper extremities. MRI of the spine shows a central syrinx in the cervical spinal cord. It is most appropriate to obtain specific additional history regarding which of the following in this patient?',
        options: [
          'Diet',
          'Family illness',
          'Recent travel',
          'Trauma',
          'Unintended weight loss'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'A 3-year-old boy is brought to the office because of a 2-day history of bulging of his left eye. He says his eye hurts. He has no history of major medical illness or recent trauma to the area, and he receives no medications. Vital signs are within normal limits. Physical examination shows exophthalmos of the left eye. MRI of the brain shows a 2-cm mass involving the ocular muscles of the left eye. A biopsy specimen of the mass shows malignant cells, some of which have striations. Which of the following is the most likely diagnosis?',
        options: [
          'Neuroblastoma',
          'Pheochromocytoma',
          'Retinoblastoma',
          'Rhabdomyosarcoma',
          'Thyroid cancer'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'An 18-year-old woman with sickle cell disease is brought to the emergency department by her parents because of a 2hour history of severe abdominal pain and nausea. Her parents say that she had a cheeseburger, milk shake, and chocolate bar for lunch. Her temperature is 37�C (98.6�F). Physical examination shows tenderness over the right upper quadrant of the abdomen, radiating to the right shoulder. Ultrasonography of the right upper quadrant of the abdomen shows gallstones. Which of the following is the most likely underlying cause of this patient\'s current condition?',
        options: [
          'Decreased hepatic secretion of lecithin',
          'Decreased reabsorption of bile salts',
          'High ratio of cholesterol to bile acids in bile (D) Infestation with parasites secreting ?-glucuronidase',
          'Overload of unconjugated bilirubin'
        ],
        correctOptionIndex: 4
      },

      {
        questionText: 'In a sample of 100 individuals, the mean leukocyte count is 7500/mm3, with a standard deviation of 1000/mm3. If the leukocyte counts in this population follow a normal (gaussian) distribution, approximately 50% of individuals will have which of the following total leukocyte counts?',
        options: [
          '5500�9500/mm3',
          '<6500/mm3 or >8500/mm3',
          '6500�8500/mm3',
          '<7500/mm3',
          '>9500/mm3'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'A previously healthy 52-year-old woman comes to the physician because of a 2-month history of fatigue, constipation, and frequent urination. Her temperature is 37.1�C (98.8�F), pulse is 80/min, respirations are 14/min, and blood pressure is 140/90 mm Hg. Diffuse crackles are heard bilaterally. Her serum calcium concentration is 11.1 mg/dL, and serum parathyroid hormone concentration is decreased. A chest x-ray shows bilateral hilar lymphadenopathy and interstitial infiltrates. Which of the following is the most likely cause of this patient\'s hypercalcemia?',
        options: [
          'Calcitriol production by activated macrophages',
          'Local resorption of bone by metastases',
          'Parathyroid hormone-related peptide secretion',
          'Secretion of parathyroid hormone',
          'Secretion of thyroid-stimulating hormone'
        ],
        correctOptionIndex: 0
      },

      {
        questionText: 'A 24-year-old woman is brought to the physician 1 month after she was involved in a motor vehicle collision that left her weak and unable to walk. Physical examination shows weakness of both hands and atrophy of the intrinsic hand muscles bilaterally. There is weakness and increased muscle tone of the lower extremities on passive range of motion. Deep tendon reflexes are normal at the biceps and triceps bilaterally and are increased at the knees and ankles. Babinski sign is present bilaterally. Sensation to pinprick is absent at and below the level of the clavicles. The lesion in this patient is most likely located at which of the following spinal cord levels?',
        options: [
          'C5',
          'C7',
          'T1',
          'T3',
          'T5'
        ],
        correctOptionIndex: 2
      },

      {
        questionText: 'A 45-year-old man is brought to the emergency department 30 minutes after the sudden onset of crushing chest pain. His father, maternal aunt, and paternal uncle all died of myocardial infarctions under the age of 50 years. Physical examination shows tendinous xanthomas on the hands and thickened Achilles tendons. Serum lipid studies show a total cholesterol concentration of 410 mg/dL, HDL-cholesterol concentration of 30 mg/dL, and triglyceride concentration of 140 mg/dL. The diagnosis of myocardial infarction is made. This patient most likely has a deficiency of which of the following?',
        options: [
          'Apo B48',
          'Apo C',
          'HMG-CoA reductase activity',
          'LDL receptor',
          'Lipoprotein lipase activity'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'A previously healthy 19-year-old man is brought to the emergency department 30 minutes after he collapsed while playing softball. He had severe, sharp, upper back pain prior to the game. He is 196 cm (6 ft 5 in) tall. His temperature is 37�C (98.6�F), pulse is 130/min, respirations are 24/min, and blood pressure is 80/50 mm Hg. Physical examination shows pallor and no jugular venous distention. Breath sounds are clear. The carotid pulses are weak. A grade 4/6, late diastolic murmur is heard at the lower left sternal border. Which of the following is the most likely cause of this patient\'s cardiac findings?',
        options: [
          'Atrial septal defect',
          'Mitral stenosis',
          'Papillary muscle rupture',
          'Perforated tricuspid valve',
          'Stretched aortic anulus'
        ],
        correctOptionIndex: 4
      },

      {
        questionText: 'A 27-year-old woman is brought to the emergency department because of a 2-week history of double vision. Neurologic examination shows that the left eye does not adduct past the midline on horizontal gaze when the patient looks to the right. Leftward horizontal gaze is normal. This patient\'s ocular movement deficit is most likely caused by damage to which of the following structures?',
        options: [
          'Left abducens nerve',
          'Left medial longitudinal fasciculus',
          'Left nucleus of the abducens nerve',
          'Right abducens nerve',
          'Right medial longitudinal fasciculus',
          'Right nucleus of the abducens nerve'
        ],
        correctOptionIndex: 1
      },

      {
        questionText: 'A 5-year-old boy is brought to the emergency department by his mother because of an episode of bloody stool 3 hours ago. The mother says the stool was hard "like pebbles" and she noted bright red blood on the tissue when the patient cleaned himself. His previous bowel movement was 5 days ago. The patient has no abdominal or rectal pain now, but he did have abdominal pain during his bowel movement 5 days ago. He has no history of major medical illness and receives no medications. Vaccinations are up-to-date. The patient has no recent history of travel. He is at the 5th percentile for height and the 10th percentile for weight; BMI is at the 50th percentile. Vital signs are within normal limits. Abdominal examination shows hypoactive bowel sounds and a soft, slightly distended abdomen that is not tender to palpation. Rectal examination shows 1 cm of bright red rectal mucosa protruding from the right side of the anus; there is no rectal bleeding. The remainder of the examination shows no abnormalities. Which of the following is the most likely cause of this patient\'s physical findings?',
        options: [
          'Constipation',
          'Cystic fibrosis',
          'Hirschsprung disease',
          'Hookworm infestation',
          'Intussusception'
        ],
        correctOptionIndex: 0
      },

      {
        questionText: 'A 25-year-old woman comes to the office because of a 3-day history of fever, chills, severe headache, weakness, muscle pain, loss of appetite, vomiting, diarrhea, and moderate abdominal pain. She is in nursing school and returned from a medical missions trip in West Africa 10 days ago. Her symptoms began abruptly while she was shopping in a supermarket after her return. Temperature is 39.0�C (102.2�F), pulse is 100/min, respirations are 22/min, and blood pressure is 110/70 mm Hg. The patient appears ill and in mild respiratory distress. Physical examination discloses poor skin turgor and hyperactive bowel sounds. Muscle strength is 4/5 throughout. Laboratory studies show leukopenia and thrombocytopenia. Which of the following is the most sensitive and specific test for detection of the suspected viral genome in this patient?',
        options: [
          'Microarray analysis',
          'Northern blot',
          'Reverse transcription-polymerase chain reaction test',
          'Southern blot',
          'Western blot'
        ],
        correctOptionIndex: 2
      },

      {
        questionText: 'A 5-month-old boy is brought to the clinic by his mother because of a 10-day history of �coughing spells� that occur several times daily and last 1 to 2 minutes; he often vomits afterwards. He was delivered at term to a 16-year-old patient, gravida 1, para 1, following an uncomplicated pregnancy and spontaneous vaginal delivery in Mexico. His parents immigrated to the USA shortly after his birth. He has no history of major medical illness and receives no medications. He has never been to a physician for a well-child examination and has not received any vaccinations. He appears well. Vital signs, including oxygen saturation, are within normal limits. During the physical examination, he coughs uncontrollably for 2 minutes, after which there is a gasping sound and subsequent vomiting. Afterwards, he appears exhausted. Physical examination shows no nasal flaring or intercostal or subcostal retractions. The lungs are clear; no wheezes or crackles are heard. A drug from which of the following classes is most appropriate for this patient?',
        options: [
          'Cephalosporin',
          'Fluoroquinolone',
          'Macrolide',
          'Penicillin',
          'Sulfonamide'
        ],
        correctOptionIndex: 2
      },

      {
        questionText: 'A 40-year-old woman comes to the physician because of a runny nose, sneezing, and itching eyes on exposure to cats since childhood. Antiallergy drugs have not provided relief. Her symptoms improve with a program of desensitization involving administration of increasing doses of the allergen. Which of the following is the most likely mechanism of the beneficial effect of this treatment?',
        options: [
          'Formation of dimers that stimulate clearance by macrophage phagocytosis',
          'Increased production of IgG antibodies that block allergen binding to mast cells',
          'Overwhelming IgE binding sites to result in inactivation of mast cells',
          'Production of an anti-idiotypic antibody to IgE that results in its clearance (E) Stimulation of macrophages to produce anti-inflammatory cytokines'
        ],
        correctOptionIndex: 1
      },

      {
        questionText: 'A 3-week-old girl delivered at term with no complications is brought to the physician by her mother because of a 1-week history of yellow eyes and skin, tan-colored stools, and dark brown urine. The newborn has been breast-feeding without difficulty. She is alert and appears to be in no distress. She is at the 50th percentile for length and weight. Physical examination shows scleral icterus and jaundice. There is mild hepatomegaly; the spleen is not palpable. Laboratory studies show: Hemoglobin 14.4 g/dL Hematocrit 43% Leukocyte count 8000/mm3 Serum Albumin 3.5 g/dL Bilirubin, total 14 mg/dL Direct 12.5 mg/dL AST 50 U/L ALT 45 U/L Which of the following is the most likely diagnosis?',
        options: [
          'Biliary atresia',
          'Crigler-Najjar syndrome, type I',
          'Gilbert syndrome',
          'Hemolytic disease of the newborn',
          'Physiologic jaundice'
        ],
        correctOptionIndex: 0
      },

      {
        questionText: 'A 65-year-old woman comes to the physician for a follow-up examination after blood pressure measurements were 175/105 mm Hg and 185/110 mm Hg 1 and 3 weeks ago, respectively. She has well-controlled type 2 diabetes mellitus. Her blood pressure now is 175/110 mm Hg. Physical examination shows no other abnormalities. Antihypertensive therapy is started, but her blood pressure remains elevated at her next visit 3 weeks later. Laboratory studies show increased plasma renin activity; the erythrocyte sedimentation rate and serum electrolytes are within the reference ranges. Angiography shows a high-grade stenosis of the proximal right renal artery; the left renal artery appears normal. Which of the following is the most likely diagnosis?',
        options: [
          'Atherosclerosis',
          'Congenital renal artery hypoplasia',
          'Fibromuscular dysplasia',
          'Takayasu arteritis',
          'Temporal arteritis'
        ],
        correctOptionIndex: 0
      },

      {
        questionText: 'A 46-year-old woman comes to the physician because of a 1-month history of fatigue, weakness, and palpitations. She has advanced kidney disease as a result of continued use of combination analgesics for low back pain. She has hypertension well controlled with a loop diuretic, a ?-adrenergic blocker, and a dihydropyridine calcium channel blocker. She has a history of gastritis and hemorrhoids associated with occult blood in the stools. She is in no acute distress. Her temperature is 36.8�C (98.2�F), pulse is 74/min, respirations are 14/min, and blood pressure is 150/86 mm Hg. Physical examination shows mild midepigastric tenderness to palpation and 2+ edema of the lower extremities. Cardiac examination shows an S4 gallop. Test of the stool for occult blood is positive. Laboratory studies show: Hemoglobin 8.8 g/dL Hematocrit 26.8% Mean corpuscular volume 82 ?m3 Serum Ferritin 262 ng/mL Folate 284 ng/mL (N=150�450) Total iron 60 ?g/dL Transferrin saturation 22% (N=20%�50%) Lactate dehydrogenase 62 U/L Which of the following is the most likely cause of this patient\'s anemia?',
        options: [
          'Bone marrow suppression',
          'Decreased erythropoietin production',
          'Intravascular hemolysis',
          'Iron deficiency anemia',
          'Splenic sequestration'
        ],
        correctOptionIndex: 1
      },

      {
        questionText: 'A 46-year-old woman comes to the physician because of a 3-day history of intermittent pain with urination and increased urinary frequency. She says that she had one similar episode during the past 6 months. She also has had irregular menses, and her last menstrual period occurred 2 months ago. She has not had fever, nausea, vomiting, or blood in her urine. She is sexually active with one male partner. Physical examination shows no abnormalities. Urinalysis shows: RBC 3�5/hpf WBC 10�20/hpf Nitrites positive Leukocyte esterase positive Bacteria positive Which of the following is the strongest predisposing risk factor for the development of this patient\'s condition?',
        options: [
          'Leiomyomata uteri',
          'Perimenopause',
          'Pregnancy',
          'Sexual intercourse'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'A 10-year-old boy is brought to the emergency department in the middle of summer because of fever, headache, and photophobia. Several of his camp mates have had a similar illness. Physical examination shows mild nuchal rigidity. A lumbar puncture is performed. Laboratory studies show: Serum glucose 90 mg/dL Cerebrospinal fluid Pressure, opening 50 mm H2O Glucose 65 mg/dL Total protein 70 mg/dL Leukocyte count 43/mm3 (95% lymphocytes) Which of the following infectious agents is the most likely cause of these findings?',
        options: [
          'Adenovirus',
          'Enterovirus',
          'Herpes simplex virus',
          'Neisseria meningitidis',
          'Streptococcus pneumoniae'
        ],
        correctOptionIndex: 1
      },

      {
        questionText: 'A 31-year-old woman with a 5-year history of fatigue comes to the physician for an initial visit. She has seen four other physicians for the same condition within the past 6 months, but no abnormalities were found. She gives the physician a large folder that contains her medical records. She says, "I can barely get out of bed most mornings, but nobody can figure out why because all of my tests turn out normal. I really think I have chronic fatigue syndrome. What do you know about this condition?" The physician has not treated any patient with chronic fatigue syndrome before. Which of the following initial statements by the physician is most appropriate to establish rapport with this patient?',
        options: [
          '"From the size of the folder you brought, it looks like you\'ve had very thorough examinations in the past."',
          '"I don\'t have much experience with chronic fatigue syndrome, but I\'m committed to learning as much as I can about it."',
          '"I\'m not familiar with chronic fatigue syndrome, except that many physicians don\'t think it\'s a real disease."',
          '"Let\'s start over from scratch. We\'ll need to repeat complete testing."',
          '"When nothing abnormal is found during thorough examinations and laboratory studies, there is often an underlying psychological cause of the symptoms."'
        ],
        correctOptionIndex: 1
      },

      {
        questionText: 'A 28-year-old man comes to the physician because of a 2-month history of a rash on his wrists and hands. He is a firstyear mortuary science student. He also works on his grandfather\'s farm each weekend. His hobbies include raising homing pigeons and repairing vintage motorcycles. He recently changed to a different type of laundry detergent to save money. Physical examination shows a diffuse erythematous rash involving both hands up to the wrist creases. The rash does not extend over any other parts of the body. Which of the following is the most likely cause of this patient\'s rash?',
        options: [
          'Change in laundry detergent',
          'Exposure to chemicals during motorcycle repair',
          'Handling pigeons',
          'Pesticide exposure',
          'Use of latex gloves'
        ],
        correctOptionIndex: 4
      },

      {
        questionText: 'A 22-year-old woman at 32 weeks� gestation comes to the office for a prenatal visit. Vital signs are within normal limits. Fundal height and fetal heart tones are also normal. At the end of the examination, the patient tells the physician that her friend is a certified lay midwife and has recently convinced her to have a home birth. The patient asks the physician if he would be the backup for the midwife in case of an emergency. Which of the following is the most appropriate initial response by the physician?',
        options: [
          '�I�m sorry, but I would no longer be able to be your doctor if you pursue a home birth.�',
          '�I would like to meet with your friend before I decide.�',
          '�If there�s a problem, I could still act as your doctor if you arrive at the hospital in labor.�',
          '�Let�s set up an appointment next week to discuss your birth plan in detail.� (E) �Perhaps your midwife could act as your birth coach instead.�'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'A 36-year-old woman with hypertension comes to the office because she thinks she may be �going through early menopause.� She has not had a menstrual period since her most recent office visit 6 months ago. During this time, she also has been �gaining weight around the middle� despite increased exercise; she has had a 6.3-kg (14-lb) weight gain. She has no other history of major medical illness. Her only medication is lisinopril. She does not smoke, drink alcohol, or use illicit drugs. She is 168 cm (5 ft 6 in) tall and weighs 107 kg (236 lb); BMI is 38 kg/m2. Vital signs are within normal limits. Examination shows a uterus consistent in size with a 24-week gestation. Pelvic ultrasonography shows oligohydramnios and a fetus with a misshapen cranium, pericardial effusion, small bladder, and echogenic bowel. The most likely cause of the fetal abnormalities in this patient�s pregnancy is interference with which of the following?',
        options: [
          'Fetal lung/epithelial differentiation',
          'Fetal lung/surfactant development',
          'Fetal renal hemodynamics',
          'Maternal placental perfusion',
          'Maternal prostaglandin synthesis'
        ],
        correctOptionIndex: 2
      },

      {
        questionText: 'A 67-year-old man comes to the office because he is concerned about memory loss. He says he sometimes forgets the names of acquaintances he sees while he is out shopping. He also has occasional word-finding difficulty and forgets to buy some items when he goes shopping unless he makes a list. He lives alone and is able to manage his finances, cook, and shop without help. He works part-time as an accountant. He has gastroesophageal reflux disease and hypertension. Current medications are hydrochlorothiazide and omeprazole. Vital signs are within normal limits. Physical and neurologic examinations show no abnormalities. On mental status examination, he is fully oriented. His speech is normal, and thoughts are organized. His mood is euthymic, and he has a full range of affect. His concentration is intact, and he is able to perform calculations quickly and accurately. He can name objects accurately and follow written and verbal commands. He recalls three of four objects after 5 minutes. Which of the following is the most appropriate physician response to this patient�s concern?',
        options: [
          '�I am concerned about your memory loss. Let�s discuss how to further evaluate your memory.�',
          '�There\'s no need to worry right now, but let\'s meet again in 6 months.�',
          '�Unfortunately, your memory loss will likely increase significantly during the next 5 years; let�s discuss some ways to plan for the future.�',
          '�Your episodes of forgetfulness are likely just �Senior Moments,� but we should obtain in-depth laboratory test results and an MRI to be certain.�',
          '�Your examination findings indicate that your memory loss is likely consistent with the normal aging process.�'
        ],
        correctOptionIndex: 4
      },

      {
        questionText: 'A 30-year-old woman comes to the office because of a 4-day history of an increasingly severe, painful rash over her body and in her mouth. The rash began over her trunk area but spread within a day to her face and extremities. Two days before development of the rash, she had flu-like symptoms with muscle aches and fatigue as well as a nonproductive cough, sore throat, and runny nose. Ten days ago, she began treatment with trimethoprim-sulfamethoxazole for a urinary tract infection; she takes no other medications. Temperature is 39.0�C (102.2�F), pulse is 120/min, respirations are 25/min, and blood pressure is 165/105 mm Hg. Physical examination shows diffuse brownish red macular exanthema with bullous lesions. Epidermis at an uninvolved site can be removed with mild tangential pressure. Examination of a biopsy specimen of one of the lesions shows necrosis of keratinocytes throughout the epidermis. There is minimal lymphocytic infiltration within the superficial dermis. Which of the following is the most likely diagnosis?',
        options: [
          'Erythema multiforme',
          'Linear IgA bullous dermatosis',
          'Pemphigus vulgaris',
          'Staphylococcal scalded skin syndrome',
          'Toxic epidermal necrolysis'
        ],
        correctOptionIndex: 4
      },

      {
        questionText: 'A 78-year-old woman is admitted to the hospital because of a 1-week history of jaundice. CT scan of the abdomen shows a mass suggestive of pancreatic cancer. Three hours later, the on-call physician enters the patient\'s room to discuss the prognosis and obtain consent for a biopsy scheduled for the next morning. On entering the room, the physician greets the patient and her husband. The physician then learns that the patient speaks only Mandarin. Her husband is fluent in Mandarin and English. The hospital interpreter is not available until tomorrow morning. The patient\'s husband appears anxious and insists that the physician speaks to him and allows him to serve as an interpreter for his wife. Which of the following is the most appropriate next step in management?',
        options: [
          'Allow the patient\'s husband to serve as an interpreter',
          'Consult the hospital ethics committee',
          'Explain to the husband that information cannot be provided until the hospital interpreter arrives in the morning (D) Use a telephone interpreter service'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'Results of a study that examined the impact of risk factors on cardiovascular health are being evaluated. In the study, serum LDL-cholesterol (LDL) concentration is found to have a correlation of 0.6 with serum high-sensitivity C-reactive protein (hs-CRP) concentration. Which of the following statements best describes the relationship between LDL concentration and hs-CRP concentration based on this finding?',
        options: [
          'Higher LDL concentrations are associated with higher hs-CRP concentrations',
          'Higher LDL concentrations are associated with lower hs-CRP concentrations',
          'Higher LDL concentrations cause higher hs-CRP concentrations (D) Higher LDL concentrations cause lower hs-CRP concentrations'
        ],
        correctOptionIndex: 0
      },

      {
        questionText: 'A 72-year-old man comes to the physician for a health maintenance examination. He has no personal or family history of major medical illnesses. He has never smoked cigarettes. Pulse oximetry on room air shows an oxygen saturation of 98%. Physical examination shows plethoric skin and splenomegaly. Laboratory studies show: Hemoglobin 21.1 g/dL Hematocrit 61% Leukocyte count 15,000/mm3 Segmented neutrophils 68% Basophils 4% Lymphocytes 28% Platelet count 501,000/mm3 Leukocyte alkaline phosphatase increased A peripheral blood smear shows occasional giant platelets. The primary hematologic defect in this patient most likely occurred in which of the following cells?',
        options: [
          'Erythroid progenitor',
          'Hematopoietic stem',
          'Lymphatic progenitor',
          'Megakaryocyte progenitor',
          'Pluripotent stem'
        ],
        correctOptionIndex: 1
      },

      {
        questionText: 'A 3800-g (8-lb 6-oz) newborn is delivered vaginally at 39 weeks\' gestation after an uncomplicated pregnancy. Apgar scores are 9 and 9 at 1 and 5 minutes, respectively. The newborn is crying, has pink skin, and appears vigorous. Physical examination shows a vagina and also a structure that appears to be a penis, with the urethra located at the base near the opening of the vagina. Chromosomal analysis is ordered. Which of the following is the most likely cause of the intersex findings in this newborn if the karyotype is found to be 46,XX?',
        options: [
          '17?-Hydroxyprogesterone deficiency',
          'Increased concentration of m�llerian-inhibiting substance',
          'Maternal androgen exposure',
          'Presence of the sex-determining region Y gene',
          '5?-Reductase deficiency'
        ],
        correctOptionIndex: 2
      },

      {
        questionText: 'An 80-year-old woman is brought to the emergency department (ED) 30 minutes after she fell out of her wheelchair at home. This is the second visit to the ED for a fall during the past 3 months. She lives with her daughter and son-in-law, who say they �do the best we can.� The patient has dementia, Alzheimer type, coronary artery disease, type 2 diabetes mellitus, and hypertension. Current medications are amlodipine, aspirin, atorvastatin, donepezil, long-acting insulin, and lisinopril. Five years ago, she underwent bilateral below-the-knee amputations because of infected ulcers of the feet. She uses a wheelchair for ambulation. Ten years ago, she underwent three-vessel coronary artery bypass grafting. She has smoked one-half pack of cigarettes daily for 60 years. She drinks one shot of whiskey nightly. She is thin and appears ill and disheveled. Her temperature is 37.2�C (99.0�F), pulse is 80/min, respirations are 20/min, and blood pressure is 120/80 mm Hg. Pulse oximetry on 2 L/min of oxygen by nasal cannula shows an oxygen saturation of 95%. Physical examination shows temporal wasting. There are scattered ecchymoses over the abdomen and all extremities. No other abnormalities are noted. Which of the following is the most appropriate initial history to obtain from this patient?',
        options: [
          'Abnormal bleeding',
          'Diet',
          'Relationship with her family',
          'Respiratory symptoms',
          'Urinary symptoms'
        ],
        correctOptionIndex: 2
      },

      {
        questionText: 'A 25-year-old woman comes to the physician because of a long history of pain with menses. The pain occurs on the first day of her 5-day menstrual period and lasts all day. She rates the pain as 10 on a 10-point scale. The most appropriate initial pharmacotherapy to relieve this patient\'s pain has which of the following mechanisms of action?',
        options: [
          'Inhibition of estrogen synthesis',
          'Inhibition of 11?-hydroxylase activity',
          'Inhibition of prostaglandin synthesis',
          'Stimulation of follicle-stimulating hormone synthesis',
          'Stimulation of luteinizing hormone synthesis'
        ],
        correctOptionIndex: 2
      },

      {
        questionText: 'A randomized clinical trial is conducted to compare wound healing and cosmetic differences between two surgical procedures for closing skin wounds following cesarean delivery. A total of 1000 women undergoing cesarean delivery during a 6-month period are enrolled in the study, which was 85% of the total number of patients undergoing the procedure. The results show a wound infection rate of 12 cases per 1000 women for Procedure A and 18 cases per 1000 women for Procedure B. Which of the following is the best estimate of the absolute risk reduction for wound infection following Procedure A compared with Procedure B?',
        options: [
          '(18/1000) � (12/1000)',
          '0.85 � (12/1000)',
          '0.85 � (18/1000)',
          '[0.85 � (18/1000�12/1000)]',
          '[(1.2/100) � (1.8/100)]/(1.8/100)'
        ],
        correctOptionIndex: 0
      },

      {
        questionText: 'A 58-year-old man with chronic obstructive pulmonary disease comes to the clinic with his wife for a follow-up examination. He has smoked one pack of cigarettes daily for 35 years. He has tried to quit smoking twice but was unsuccessful both times. At today�s visit, when the physician asks the patient about smoking cessation, he says he is not ready to do so. The patient�s wife states her husband�s smoking makes her cough and gives her chest tightness. Which of the following is the most appropriate physician statement?',
        options: [
          '"Are there any reasons why you might want to quit smoking?"',
          '"Are you aware that your lung condition is chronic at this point?"',
          '"I\'m sure you don\'t want your wife to suffer as a result of your smoking." (D) "The majority of your health issues would improve if you quit smoking." (E) "Why haven\'t you been able to stay off cigarettes?"'
        ],
        correctOptionIndex: 0
      },

      {
        questionText: 'Seven days after admission to the psychiatric unit for treatment of eating disorders, a hospitalized 20-year-old woman has a 2-day history of moderate mouth pain on the inside of both cheeks. She also reports feeling "worthless and fat." Fluoxetine was started on admission. She appears distressed. She is 170 cm (5 ft 7 in) tall and weighs 77 kg (170 lb); BMI is 27 kg/m2. Vital signs are within normal limits. Physical examination shows bilateral swelling of the parotid and submandibular glands, discoloration of several teeth, and scarring on the dorsum of the right hand. Mental status examination shows no suicidal ideation or intent. Results of laboratory studies are within the reference ranges. A medication with which of the following mechanisms of action is most appropriate to treat this patient\'s current symptoms?',
        options: [
          'Binding to muscarinic acetylcholine receptors',
          'Binding to nicotinic acetylcholine receptors',
          'Inhibition of protein synthesis via binding to 50S ribosomal subunits and preventing peptide bond formation (D) Inhibition of protein synthesis via loss of DNA helical structure',
          'Interference with bacterial wall synthesis'
        ],
        correctOptionIndex: 0
      },

      {
        questionText: 'A 35-year-old woman, gravida 2, para 1, at 15 weeks� gestation is brought to the hospital in active labor. The physician care team confers and determines that the birth cannot be prevented and that the fetus will not survive. After explaining this fact to the patient, the patient says, "I know it is a long shot, but I still want my baby resuscitated and everything done to save him." After empathizing with the patient, which of the following is the most appropriate initial response by the physician?',
        options: [
          '"I will ask for a second opinion."',
          '"I will call the father of the baby to get his opinion as well."',
          '"I will call for a medical ethics consultation." (D) "I will do everything I can to save the baby."',
          '"I�m very sorry, but the baby will not survive."'
        ],
        correctOptionIndex: 4
      },

      {
        questionText: 'A 48-year-old man who is a contractor interpreter working for the military at a US outpost in Afghanistan comes to the medical clinic because of a 20-day history of nonhealing, painless ulcers on his neck and arms. The lesions enlarged over time and began to express clear fluid, eventually forming shallow ulcers. When the symptoms began, he was sleeping on a mattress on the floor in an old building without air conditioning where the ambient temperature ranged from 21.1�C (70.0�F) to 43.3�C (110.0�F). He originally attributed the lesions to bug bites. Vital signs are within normal limits. Physical examination shows six 2-cm, papular lesions scattered over the neck and upper extremities; each lesion has a 0.6-cm ulcer in the center. There is no pus or exudate. Which of the following vectors is the most likely source of the lesions in this patient?',
        options: [
          'Flea',
          'Mosquito',
          'Sand fly',
          'Spider',
          'Tick'
        ],
        correctOptionIndex: 2
      },

      {
        questionText: 'A 17-year-old boy is brought to the clinic for a follow-up examination. He has been evaluated for three episodes of fullbody weakness at the ages of 13, 16, and 17 years. Each episode occurred when he lay down after playing in a football scrimmage. The weakness improved spontaneously during the next 6 hours; he was asymptomatic by the time he was evaluated by medical personnel. The patient attributes the episodes to eating "a lot of pasta and salty foods" prior to playing football. Results of a complete blood count and comprehensive metabolic profile following each episode have been within the reference ranges. He has no history of serious illness and takes no medications. Vital signs are within normal limits. Physical and neurologic examinations disclose no abnormalities. Which of the following serum concentrations is most likely to be abnormal if measured during one of this patient\'s episodes?',
        options: [
          'Calcium',
          'Chloride',
          'Magnesium',
          'Potassium',
          'Sodium'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'A 3-day-old female newborn is brought to the hospital because of a yellowish, milky fluid leaking from both nipples. She was delivered at term to a 20-year-old woman. Pregnancy and delivery were uncomplicated. Examination of the newborn is otherwise unremarkable. Which of the following hormones is the most likely cause of this finding?',
        options: [
          'Maternal estrogen',
          'Maternal progesterone',
          'Maternal prolactin',
          'Newborn estrogen',
          'Newborn progesterone',
          'Newborn prolactin'
        ],
        correctOptionIndex: 2
      },

      {
        questionText: 'A 37-year-old man who is a carpenter is brought to the emergency department 45 minutes after the sudden onset of fever, shortness of breath, and palpitations. Four days ago, he sustained a puncture wound to his left hand; he treated the wound with antibacterial cream and a bandage. His temperature is 39�C (102.2�F), pulse is 120/min, respirations are 28/min, and blood pressure is 100/60 mm Hg. Examination of the left hand shows diffuse swelling, erythema, and a 2-cm, necrotic puncture wound. His leukocyte count is 14,000/mm3. Arterial blood gas analysis on room air shows a PCO2 of less than 32 mm Hg. Which of the following is the most likely infectious agent in this patient?',
        options: [
          'Clostridium tetani',
          'Mycobacterium abscessus',
          'Pasteurella multocida',
          'Pseudomonas aeruginosa',
          'Staphylococcus aureus USMLE STEP 1 SAMPLE TEST QUESTIONS BLOCK 3, ITEMS 81-119'
        ],
        correctOptionIndex: 4
      },

      {
        questionText: 'A 45-year-old woman comes to the office for a follow-up examination 2 weeks after she sustained a vertebral fracture at L1. The fracture occurred spontaneously and there is no history of trauma to the area or other fractures. She gained 27 kg (60 lb) during the 6 months before the fracture occurred. Her only medication is hydromorphone as needed for pain. She is 163 cm (5 ft 4 in) tall and now weighs 100 kg (220 lb); BMI is 38 kg/m2. Temperature is 37.0�C (98.6�F), pulse is 86/min, respirations are 12/min, and blood pressure is 145/98 mm Hg. Physical examination shows central obesity and purple striae over the abdomen bilaterally. The lower extremities appear thin. Results of laboratory studies are shown: Plasma Renin activity 5.0 ng/mL/h (N=0.6�4.0) Metanephrine 0.3 nmol/L (N<0.4) Serum Cortisol, random 43 ?g/dL Adrenocorticotropic hormone 120 pg/mL (N<120) Aldosterone 8 ng/dL (N=2�9) Urine 24-hour free cortisol excretion 340 �g/24 h (N=3.5�45) The most likely cause of the fracture in this patient is an increase in which of the following processes?',
        options: [
          'Calcium absorption',
          'Calcium excretion',
          'Osteoblast proliferation',
          'Osteoclast proliferation',
          'Phosphorus absorption',
          'Phosphorus excretion'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'A 25-year-old woman comes to the emergency department because of a 3-hour history of fever, severe headache, lightheadedness, dizziness, shaking chills, and muscle aches. Five hours ago, she was diagnosed with Lyme disease and began doxycycline therapy. She has no other history of serious illness and takes no other medications. Menses occur at regular 28-day intervals. She is currently menstruating and using a tampon. She appears anxious. Temperature is 37.0�C (98.6�F), pulse is 120/min, respirations are 30/min, and blood pressure is 90/60 mm Hg. Pulse oximetry on room air shows an oxygen saturation of 94%. Physical examination shows flushing and diaphoresis. Cardiopulmonary examination shows no other abnormalities. Which of the following is the most likely mechanism of this patient�s current condition?',
        options: [
          'Exacerbation of infection by Borrelia burgdorferi',
          'Infection-mediated sepsis',
          'IgE-mediated allergic reaction to doxycycline',
          'Release of bacterial products producing acute inflammation (E) Secretion of bacterial endotoxins'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'A newborn delivered at 36 weeks\' gestation to a 22-year-old woman, gravida 1, para 1, has difficulty feeding and listlessness. The mother received no prenatal care. Spontaneous vaginal delivery was uncomplicated. The mother\'s only medication was a prenatal vitamin. The newborn\'s length is 49 cm (19 in; 39th percentile), and weight is 3100 g (6 lb 13 oz; 30th percentile); head circumference is 33 cm (13 in; 12th percentile). Temperature is 37.0�C (98.6�F), pulse is 134/min, respirations are 38/min, and blood pressure is 73/50 mm Hg. Physical examination shows ambiguous genitalia. Results of serum studies are shown: Na+ 133 mEq/L K+ 5.0 mEq/L (N=3.2�5.5) Cl� 103 mEq/L HCO3� 17 mEq/L Glucose 42 mg/dL (N=30�60) The most appropriate pharmacotherapy for this patient targets which of the following receptors?',
        options: [
          'Adrenocorticotropic hormone',
          'Aldosterone',
          'Androgen',
          'Gonadotropin-releasing hormone',
          'Growth hormone'
        ],
        correctOptionIndex: 1
      },

      {
        questionText: 'A 60-year-old woman is brought to the emergency department because of a 4-day history of fever, joint aches, and rash. Three weeks ago, she was admitted to the hospital for treatment of Staphylococcal aureus endocarditis. She has received 21 days out of a prescribed 42-day course of intravenous oxacillin. Currently, she appears to be in mild distress. Temperature is 38.0�C (100.4�F), pulse is 115/min, respirations are 24/min, and blood pressure is 120/70 mm Hg. Pulse oximetry on room air shows an oxygen saturation of 97%. Physical examination shows a diffuse maculopapular rash over the trunk and upper and lower extremities. There is no pus or erythema at the skin insertion site of the peripherally inserted central catheter line initially placed on the day of hospital discharge. Results of laboratory studies are shown: Hemoglobin 11.1 g/dL Hematocrit 33% Leukocyte count 12,100/mm3 Segmented neutrophils 78% Eosinophils 9% Lymphocytes 7% Monocytes 6% Platelet count 341,000/mm3 Serum Na+ 133 mEq/L K+ 6.5 mEq/L Cl? 100 mEq/L HCO3? 15 mEq/L Urea nitrogen 65 mg/dL Glucose 96 mg/dL Creatinine 5.7 mg/dL Urine microscopy shows eosinophils and WBC casts. Which of the following is the most likely underlying cause of this patient\'s condition?',
        options: [
          'Collapsing focal segmental glomerulosclerosis',
          'Glomerular hypertrophy with hemorrhage and necrosis',
          'Interstitial inflammatory infiltrate',
          'Mesangial expansion with glomerular basement membrane thickening (E) Proximal tubular dilation with loss of brush border'
        ],
        correctOptionIndex: 2
      },

      {
        questionText: 'A 48-year-old man comes to the physician requesting treatment for alcohol withdrawal. He reports a 30-year history of consuming 6 to 10 beers daily. He has had two citations for driving while intoxicated. He has previously experienced alcohol-associated seizures and withdrawal symptoms. His vital signs are within normal limits. Physical examination shows palmar erythema. The most appropriate pharmacotherapy in this patient most likely has which of the following mechanisms?',
        options: [
          'Blockade of dopamine receptors',
          'Decreased activity of dopamine transporters',
          'Enhancement of the effect of postsynaptic ?-aminobutyric acid (GABA)',
          'Increased GABA transaminase activity',
          'Inhibition of glutamate release',
          'Inhibition of serotonin reuptake',
          'Opening of glutamate channels',
          'Stimulation of 5-hydroxytryptophan receptors'
        ],
        correctOptionIndex: 2
      },

      {
        questionText: 'A 6-year-old girl is brought to the office because of two episodes of vaginal bleeding during the past 2 months. She has no history of serious illness and receives no medications. She does not appear to be in distress. She is at the 60th percentile for height, 40th percentile for weight, and 35th percentile for BMI. Vital signs are within normal limits. Physical examination discloses palpable breast buds and minimal coarse, pigmented hair on the labia. The remainder of the examination shows no abnormalities. Results of serum studies are shown: Thyroid-stimulating hormone 2.1 mU/mL (N=0.5�5.0) Testosterone 680 ng/dL (N=0.17�0.7) Adrenocorticotropic hormone 18 pg/mL (N=9�52) Estradiol 185 pg/mL (N<20) Follicle-stimulating hormone 15 mIU/mL (N<6.7) Luteinizing hormone 3.0 mIU/mL (N<0.2) Which of the following is the most likely cause of this patient\'s condition?',
        options: [
          'Central activation of neurons',
          'Ectopic prolactin secretion',
          'Exogenous sex steroid secretion',
          'Germline GNAS activating mutation',
          '21-Hydroxylase deficiency'
        ],
        correctOptionIndex: 0
      },

      {
        questionText: 'A previously healthy 64-year-old man is brought to the emergency department 3 hours after the sudden onset of severe flank pain. He has no history of similar pain or serious illness. He takes no medications. He appears to be in distress. His pulse is 100/min, and blood pressure is 168/92 mm Hg. Physical examination shows a soft abdomen with left-sided tenderness. Urinalysis shows microscopic hematuria. A CT scan of the abdomen shows a small ureteric calculus. Analgesic therapy is initiated and the pain resolves 1 hour later. The urine is then strained and a uric acid calculus is found. Which of the following processes is most likely impaired in this patient?',
        options: [
          'Bile salt metabolism',
          'Cholesterol metabolism',
          'Cytochrome P450 activity',
          'Purine metabolism',
          'Urea cycle'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'Patient Information Age: 34 years Gender: M, self-identified Race/Ethnicity: unspecified Site of Care: office The patient presents because of a 2-year history of recurrent abdominal pain and diarrhea; he also has had an 11-kg (25lb) weight loss during this period. He describes his stools as copious, loose, oily and foul-smelling. His bowel movements occur six to eight times daily, often immediately after meals, and are associated with bloating and cramping. Since the age of 21 years, he has had several episodes of acute pancreatitis. He has not had fevers or bloody stools. He is 178 cm (5 ft 10 in) tall and weighs 57 kg (125 lb); BMI is 18 kg/m2. Physical examination shows a flat abdomen with hyperactive bowel sounds and diffuse mild tenderness. Digital rectal examination shows no abnormalities. Test of the stool for occult blood is negative. Treatment with which of the following enzymes is most likely to be beneficial in this patient?',
        options: [
          'Amylase',
          'Lactase',
          'Lipase',
          'Protease',
          'Tryptase'
        ],
        correctOptionIndex: 2
      },

      {
        questionText: 'A 4-year-old girl with type 1 diabetes mellitus is brought to the emergency department by her father because of a 4-hour episode of restlessness, sweating, and confusion that occurred during the night. Yesterday, he allowed her to eat cupcakes and cotton candy at a county fair. At her bedtime that evening, he increased her dose of subcutaneous intermediateacting and long-acting insulin. Her symptoms began 6 hours later, then resolved spontaneously. After being informed this morning of this nighttime episode, the mother insisted the father bring the patient to the hospital. On arrival, the patient is alert. Her vital signs are within normal limits. Examination shows no abnormalities. Her fingerstick blood glucose concentration is 72 mg/dL. Urinalysis is negative for glucose and ketones. Which of the following is the most likely explanation for this patient\'s nighttime symptoms?',
        options: [
          'Hyperglycemia caused by increased glucose consumption',
          'Hyperglycemia caused by increased glycogen metabolism',
          'Hyperglycemia caused by insufficient exogenous insulin',
          'Hypoglycemia caused by excess exogenous insulin',
          'Hypoglycemia caused by excessive renal glucose loss',
          'Hypoglycemia caused by increased glucagon secretion',
          'Nightmare disorder',
          'Sleep terror disorder'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'A 66-year-old man who was recently diagnosed with Parkinson disease comes to the physician for a follow-up examination. Carbidopa-levodopa therapy was initiated at the time of diagnosis. The patient tells the physician that he still has episodes during which he "freezes." He has a clumsy gait, and there is rigidity of his upper extremities and hands. An adjunct therapy designed to inhibit which of the following enzymes is most likely indicated in this patient?',
        options: [
          'Aromatic L-amino acid decarboxylase',
          'Dopamine ?-hydroxylase',
          'Monoamine oxidase B',
          'Phenylethanolamine N-methyltransferase',
          'Tyrosine hydroxylase'
        ],
        correctOptionIndex: 2
      },

      {
        questionText: 'A 2-week-old male newborn is brought to the office for a well-child examination. He was delivered following an uncomplicated, spontaneous vaginal delivery at 41 weeks\' gestation. The mother has no history of serious illness and did not receive prenatal care. Her only medication is a prenatal vitamin. She has consumed large amounts of vodka nightly for 10 years. Which of the following examination findings is most likely to be present in this patient?',
        options: [
          'Hypospadias',
          'Limb hypoplasia',
          'Neck webbing',
          'Short palpebral fissures',
          'Spasticity'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'Patient Information Age: 16 years Gender: M, self-identified Race/Ethnicity: Hispanic, self-identified Site of Care: clinic History Reason for Visit/Chief Concern: "I haven\'t started puberty yet." History of Present Illness: � absence of pubic and facial hair � small penis and testicle size Past Medical History: � no serious illness Medications: � none Allergies: � no known drug allergies Psychosocial History: � does not smoke cigarettes, drink alcoholic beverages, or use other substances Physical Examination Temp Pulse Resp BP O2 Sat Ht Wt BMI 36.0�C 76/min 13/min 108/61 mm Hg 98% 184 cm 90 kg 27 kg/m2 (96.8�F) on RA (6 ft) (198 lb) 90th %ile 97th %ile � Appearance: long extremities � Skin: no facial or axillary hair � HEENT: PERRLA � Chest: bilateral gynecomastia � Pulmonary: clear to auscultation � Cardiac: normal S1 and S2 � Abdominal: normoactive bowel sounds; no tenderness to palpation; no hepatosplenomegaly � Genitourinary: small testicular and penile size; minimal pubic hair; SMR 2 � Neurologic: muscle strength 5/5 throughout Diagnostic Studies: Serum Follicle-stimulating hormone 45 mIU/mL Luteinizing hormone 34 mIU/mL Testosterone 45 ng/dL (N=270�950) TSH 2.2 ?U/L 94th %ile Question: Which of the following is the most likely underlying cause of this patient\'s condition?',
        options: [
          'Constitutional delay in puberty',
          'Hypoplasia of hypothalamic gonadotropin-releasing hormone neurons',
          'Inactivating mutation of the follicle-stimulating hormone-receptor',
          'Mutation in the 21-hydroxylase gene',
          'Nondisjunction of X chromosome during meiosis'
        ],
        correctOptionIndex: 4
      },

      {
        questionText: 'A 15-year-old boy is brought to the office by his parents to discuss results of a biopsy done 3 days ago for a rapidly enlarging neck mass. He first noted the mass 1 month ago. Two weeks ago, he was evaluated for an episode of prolonged epistaxis and was found to have a right ear effusion, which was treated with amoxicillin-clavulanic acid. He has no other history of serious illness and takes no medications. Height is at the 10th percentile, weight is at the 50th percentile, and BMI is at the 75th percentile. Vital signs are within normal limits. Physical examination shows a right ear effusion and a 4-cm, firm mass in the right posterior triangle of the neck. Results of a biopsy specimen show squamous epithelium with indistinct cell margins, enlarged atypical nuclei, and absent keratin formation. Which of the following infectious agents is the most likely underlying cause of this patient\'s current condition?',
        options: [
          'Cytomegalovirus',
          'Epstein-Barr virus',
          'HIV',
          'Human herpesvirus 8'
        ],
        correctOptionIndex: 1
      },

      {
        questionText: 'A 48-year-old woman with type 2 diabetes mellitus comes to the physician for a follow-up examination. Current medications are metformin and once-daily insulin. She travels frequently and works long hours. She says that her meals are usually fast food. She leads a sedentary lifestyle. She often forgets to measure her blood glucose concentration. Her last hemoglobin A1c was measured as 8.4%. Which of the following is the most appropriate action by the physician to help this patient improve her diabetic control?',
        options: [
          'Create an exercise regimen for the patient',
          'Explore barriers to diet adherence',
          'Increase the patient\'s insulin dosage',
          'Increase the patient\'s metformin dosage',
          'Measure the patient\'s blood glucose concentration',
          'Order measurement of the patient\'s microalbumin concentration (G) Refer the patient to a nutritionist'
        ],
        correctOptionIndex: 1
      },

      {
        questionText: 'A 74-year-old woman with a history of coronary artery disease is brought to the emergency department 30 minutes after the sudden onset of crushing chest pain. Her pulse is 120/min, and systolic blood pressure is 70 mm Hg. An ECG shows sinus rhythm with ST elevation in leads V1 through V3. The physician plans to administer a drug to increase the patient\'s blood pressure without increasing her pulse. Which of the following drugs is most appropriate for this patient?',
        options: [
          'Dopamine',
          'Epinephrine',
          'Isoproterenol',
          'Norepinephrine',
          'Phenylephrine'
        ],
        correctOptionIndex: 4
      },

      {
        questionText: 'A 2-month-old girl is admitted to the hospital because of severe pneumonia. She has a history of mucocutaneous candidiasis and chronic diarrhea. Her pulse is 160/min, and respirations are 40/min. Crackles are heard over both lung fields. Her leukocyte count is 5400/mm3 (N=5000�19,500), with 86% segmented neutrophils, 6% lymphocytes, and 8% monocytes. Immunologic testing of a specimen obtained via bronchoscopy is positive for Pneumocystis jirovecii. Flow cytometry shows normal concentrations of natural killer cells but no T or B lymphocytes in the peripheral blood. Results of a polymerase chain reaction test of the immunoglobulin V(D)J regions from a bone marrow specimen show an absence of characteristic rearrangements. The most likely cause of these findings is an alteration of which of the following?',
        options: [
          'Bruton tyrosine kinase',
          'CD40 ligand',
          'Mevalonate kinase',
          'NADPH oxidase',
          'Recombination-activating gene 1 (RAG1) and RAG2'
        ],
        correctOptionIndex: 4
      },

      {
        questionText: 'A 25-year-old woman, gravida 1, para 1, comes to the office because of a 2-week history of palpitations and heat intolerance. She delivered her child 3 months ago following an uncomplicated pregnancy and delivery. She is breastfeeding. She has no history of serious illness and takes no medications. She is 163 cm (5 ft 4 in) tall and weighs 54 kg (120 lb); BMI is 21 kg/m2. Temperature is 37�C (98.6�F), pulse is 106/min, respirations are 20/min, and blood pressure is 124/68 mm Hg. Examination shows moist palms and bilateral lid lag. No exophthalmos is noted. The thyroid gland is enlarged and nontender. No murmurs are heard on cardiac examination. Deep tendon reflexes are 3+. Serum studies show an undetectable TSH concentration, thyroxine (T4) concentration of 20 ?g/dL, and triiodothyronine (T3) concentration of 275 ng/dL. Which of the following is the most likely mechanism of this patient\'s symptoms?',
        options: [
          'Activation of mutations of TSH receptors',
          'Increased serum thyroglobulin concentration',
          'Ischemic injury to the hypothalamus',
          'Lymphocytic infiltration of the thyroid',
          'Presence of TSH receptor autoantibodies'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'A 73-year-old woman comes to the emergency department because of a 6-hour history of severe abdominal pain. She has chronic atrial fibrillation and underwent placement of a prosthetic mitral valve 4 years ago. Her pulse is 120/min and irregularly irregular, and blood pressure is 80/60 mm Hg. Arteriography shows an embolus in the superior mesenteric artery lodged just beyond the patent middle colic artery. A laparotomy is done. During this procedure, which of the following segments of the abdominal viscera is most likely to appear normal?',
        options: [
          'Ascending colon',
          'Distal ileum',
          'Distal jejunum',
          'Proximal ileum',
          'Proximal jejunum'
        ],
        correctOptionIndex: 4
      },

      {
        questionText: 'A 2-year-old boy is brought to the physician because of failure to thrive. He also has had loose, fatty, foul-smelling stools and a cough during the past 2 weeks. He is at the 30th percentile for height and 10th percentile for weight. Physical examination shows no other abnormalities. Laboratory studies show steatorrhea and a sweat chloride concentration of 80 mmol/L. A chest x-ray shows hyperinflation. Sputum culture grows Haemophilus influenzae and Staphylococcus aureus. Secretion of which of the following substances is most likely to be decreased in this patient?',
        options: [
          'Bicarbonate',
          'Gastric acid',
          'Glucagon',
          'Insulin',
          'Intrinsic factor'
        ],
        correctOptionIndex: 0
      },

      {
        questionText: 'A 73-year-old man is brought to the emergency department by his family 1 hour after he walked into the left side of a door frame when leaving his bedroom and then tripped over a chair that was on his left side. Visual field testing shows left lower quadrantanopia. When tactile stimuli are presented on both the left and right sides simultaneously, the patient correctly identifies only the ones on the right. Further examination shows no motor or language deficits. Proprioception is intact. This patient most likely has a brain lesion in which of the following lobes?',
        options: [
          'Left frontal',
          'Left parietal',
          'Left temporal',
          'Right frontal',
          'Right parietal',
          'Right temporal'
        ],
        correctOptionIndex: 4
      },

      {
        questionText: 'A 10-year-old boy is brought to the physician because of a 3-week history of nosebleeds and easy bruisability. His older brother has had similar episodes. He is at the 30th percentile for height and weight. Physical examination shows nasal and gingival bleeding and several ecchymoses over the trunk and upper and lower extremities in various stages of healing. Laboratory studies show a platelet count of 300,000/mm3 (N=150,000�400,000). Platelet adhesion testing shows a normal response to ristocetin, but aggregation does not occur in response to thrombin; platelet morphology is normal. Prothrombin time and activated partial thromboplastin time are within the reference ranges. A defect in which of the following is the most likely cause of the findings in this patient?',
        options: [
          'Factor VII (proconvertin)',
          'Fibrinogen',
          'Glycoprotein IIb-IIIa',
          'Granule storage pool',
          'von Willebrand factor'
        ],
        correctOptionIndex: 2
      },

      {
        questionText: 'A previously healthy 45-year-old woman who works as a park ranger comes to the physician because of a 1-week history of shortness of breath, even at rest. She has lived in the mountains at 10,000 feet above sea level for 2 years; the physician�s office is located at sea level. Her pulse is 85/min, respirations are 18/min, and blood pressure is 125/90 mm Hg. Physical examination while sitting upright shows jugular venous distention and 2+ pedal edema. During the past 2 years, which of the following has most likely decreased in this patient?',
        options: [
          'Height of P waves in lead I of the patient\'s ECG',
          'Height of R waves in lead V1 of the patient\'s ECG',
          'Hematocrit',
          'Pulmonary vascular resistance',
          'Right ventricular diastolic compliance',
          'Right ventricular wall thickness'
        ],
        correctOptionIndex: 4
      },

      {
        questionText: 'A 5-year-old girl is brought to the office by her mother because of a 6-hour history of bloody diarrhea. She is interactive and in no acute distress. Her blood pressure is 90/55 mm Hg. Abdominal examination shows normoactive bowel sounds. Stool cultures are obtained, and the patient\'s mother is advised to give the girl plenty of fluids. Five days later, the patient develops decreased urine output and is brought back to the office. Her blood pressure is now 135/88 mm Hg. Physical examination shows pallor. Laboratory studies show: Hemoglobin 8.5 g/dL (N=11�15) Hematocrit 26% (N=28%�45%) Platelet count 45,000/mm3 (N=150,000�400,000) Serum creatinine 3.3 mg/dL (N=0.3�0.7) Which of the following infectious agents is the most likely cause of these findings?',
        options: [
          'Campylobacter jejuni',
          'Escherichia coli',
          'Rotavirus',
          'Salmonella enterica serovar enteritidis',
          'Yersinia pestis'
        ],
        correctOptionIndex: 1
      },

      {
        questionText: 'A 78-year-old woman is admitted to the intensive care unit because of diverticulitis complicated by Escherichia coli sepsis. Treatment with ciprofloxacin is started. Three days later, her serum creatinine concentration has increased from 0.7 mg/dL on admission to 1.3 mg/dL. Urinalysis shows muddy brown casts. The most likely cause of the findings in this patient is ischemia of which of the following structures?',
        options: [
          'Bowman capsule',
          'Glomerulus',
          'Interstitium',
          'Proximal tubule',
          'Renal vein'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'A 19-year-old man who is a college freshman comes to the office because of a 4-day history of tender, swollen glands. He also has a 6-day history of fever, malaise, and decreased appetite. His temperature is 38.7�C (101.7�F). Physical examination shows swelling of the parotid glands. Which of the following infectious agents is the most likely cause of these findings?',
        options: [
          'Epstein-Barr virus',
          'Hepatitis B virus',
          'Measles virus',
          'Mumps virus',
          'Rubella virus'
        ],
        correctOptionIndex: 3
      },

      {
        questionText: 'A 34-year-old woman with myasthenia gravis comes to the emergency department because of a 2-day history of increasing weakness, shortness of breath, and abdominal cramping. Current medications are prednisone and pyridostigmine. Her temperature is 37�C (98.6�F), pulse is 45/min, and respirations are 25/min and shallow. Her voice is soft and hypernasal, and she coughs weakly when swallowing water. Breath and heart sounds are normal. Pulmonary testing shows inability to generate a normal negative inspiratory force during forced inspiration. The abdomen is soft and nontender, with increased bowel sounds. Muscle strength is 4/5 diffusely, with severe, continuous, and diffuse fasciculations. Deep tendon reflexes are sluggish, but symmetric. Which of the following is the most likely cause of this patient\'s weakness?',
        options: [
          'Aspiration pneumonia',
          'Guillain-Barr� syndrome',
          'Insufficient dose of prednisone',
          'Motor neuron disease',
          'Pyridostigmine overdose'
        ],
        correctOptionIndex: 4
      },

      {
        questionText: 'A 35-year-old woman comes to the office because she has had three first-trimester spontaneous abortions during the past 3 years. Physical examination shows no abnormalities. Laboratory studies show no endocrine abnormalities. Chromosomal analysis shows a paracentric inversion of the long arm of chromosome 1. Which of the following best describes this patient�s risk for early spontaneous abortions and a liveborn child with aneuploidy? Risk for Early Risk for Liveborn Spontaneous Abortions Child With Aneuploidy',
        options: [
          'High high (B) High low (C) Low high',
          'Low low'
        ],
        correctOptionIndex: 1
      },

      {
        questionText: 'A 25-year-old man comes to the office because of a 4-hour history of irritability, restlessness, tremor, and palpitations. He is a known user of amphetamines. His pulse is 120/min, respirations are 25/min, and blood pressure is 150/100 mm Hg. Physical examination shows no abnormalities. The most likely cause of this patient\'s symptoms is sympathomimetic activity arising from which of the following?',
        options: [
          'Decreased intracellular metabolism of biogenic amines',
          'Decreased monoamine oxidase activity',
          'Decreased presynaptic receptor activation',
          'Increased intracellular metabolism of biogenic amines',
          'Increased presynaptic receptor activation',
          'Increased release of biogenic amines'
        ],
        correctOptionIndex: 5
      },

      {
        questionText: 'A 14-year-old boy is brought to the office by his mother because of a 1-week history of seizures and difficulty walking. Physical examination shows decreased sensation over the hands and feet and generalized weakness. He walks with an ataxic gait. A muscle biopsy specimen shows coarsely granular fibers that stain red with Gomori trichrome stain. This patient most likely has a genetic defect that most directly affects the synthesis of which of the following?',
        options: [
          'ATP',
          'Creatine phosphate',
          'Glycogen',
          'NADH',
          'Pyruvate'
        ],
        correctOptionIndex: 0
      },

      {
        questionText: 'A 72-year-old man is brought to the office because of a 6-month history of increasing fatigue and a 1-month history of numbness of his feet. Physical examination shows marked pallor. Proprioception and sensation to vibration are decreased in the lower extremities. Laboratory studies show: Hemoglobin 7.6 g/dL Mean corpuscular volume 117 ?m3 Reticulocyte count 0% Serum vitamin B12 (cobalamin) 23.6 pg/mL (N=200�900) Histopathology of a gastric mucosal biopsy specimen shows atrophic gastritis with extensive lymphocyte infiltration. Serologic studies will most likely show autoantibodies to which of the following labeled cell types in the photomicrograph of normal mucosa or to one of its secretory products? atrial fibrillation. Appropriate pharmacotherapy was initiated at that time, and normal sinus rhythm was restored. Her pulse is 76/min, and blood pressure is 132/86 mm Hg. Physical examination shows no abnormalities. The ECGs shown represent before (solid line) and after (dashed line) administration of the antiarrhythmic drug. Which of the following drugs was most likely prescribed?',
        options: [
          'Amiodarone',
          'Digoxin',
          'Mexiletine',
          'Phenytoin',
          'Verapamil'
        ],
        correctOptionIndex: 4
      },

      {
        questionText: 'A 4-year-old boy develops fever 3 weeks after being admitted to the hospital for induction chemotherapy for treatment of acute lymphoblastic leukemia. Chemotherapy medications are L-asparaginase, dexamethasone, doxorubicin, and vincristine. His temperature is 38.2�C (100.8�F), pulse is 122/min, and respirations are 24/min. Physical examination shows pallor, alopecia, and ulcerations over the gums. A central venous catheter with entry site in the right upper chest is present but has no surrounding erythema. A blood culture grows gram-negative rods after 36 hours. Which of the following underlying mechanisms is the most likely cause of this patient\'s susceptibility to infection?',
        options: [
          'Deficiency of terminal complement',
          'Hypogammaglobulinemia',
          'Impaired T-lymphocyte function',
          'Inhibition of tumor necrosis factor ? function',
          'Neutropenia'
        ],
        correctOptionIndex: 4
      },

      {
        questionText: 'A 6-year-old boy with acute lymphoblastic leukemia is brought to the office for a follow-up examination. He is receiving high-dose methotrexate therapy. A drug is added to the patient\'s medication regimen to decrease the toxicity of this therapy to normal cells. The beneficial effect of this new drug on normal cells is most likely achieved by bypassing the cellular requirement for which of the following enzymes?',
        options: [
          'Dihydrofolate reductase',
          'Methionine synthase',
          'Pyruvate decarboxylase',
          'Thiamine pyrophosphate',
          'Thymidylate synthase'
        ],
        correctOptionIndex: 0
      },

      {
        questionText: 'A screening test for breast cancer is administered to 1000 women with biopsy-proven breast cancer and to 1000 women without breast cancer. The test results are positive for 250 of the subjects with breast cancer and 100 of the subjects without breast cancer. The screening test is now to be used on a population of 100,000 women with a known prevalence rate of breast cancer of 80 per 100,000. Which of the following is the expected number of false-positives?',
        options: [
          '20',
          '80',
          '8993',
          '9992',
          '10,012 ANSWER FORM FOR USMLE STEP 1 SAMPLE TEST QUESTIONS Block 1 (Questions 1�40)'
        ],
        correctOptionIndex: 3
      }
    ];