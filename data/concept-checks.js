/* Original ChemAtlas questions aligned to each existing lesson. The original check is retained.
 * References: course sources in data/genchem.js; OpenStax Chemistry 2e, chapters 1–17.
 * Each tuple is [prompt, choices, correct index, explanation, callback module, section index]. */
(() => {
  const banks = {
    measurement: [
      ['Which quantity includes both a number and a unit?', ['25','25 mL','mL','approximately'],1,'A measurement reports a numerical value and its unit.'],
      ['Repeated measurements are close together but far from a known reference. They are…',['accurate only','precise only','both accurate and precise','neither'],1,'Precision describes agreement among repeated measurements; accuracy describes agreement with a reference.'],
      null,
      ['Convert 0.0250 L to milliliters.',['0.0000250 mL','0.250 mL','25.0 mL','250 mL'],2,'0.0250 L × (1000 mL / 1 L) = 25.0 mL. The conversion factor is exact; preserve three significant figures.'],
      ['A sample has mass 10.0 g and volume 5.00 mL. Which setup gives density and explains why?', ['5.00 mL / 10.0 g; density is volume per mass','10.0 g × 5.00 mL; multiply all measurements','10.0 g / 5.00 mL; density is mass per volume','10.0 g + 5.00 mL; add the units'],2,'Density is mass per volume: 2.00 g/mL. Unit analysis checks whether a calculation answers the physical question.','measurement',2],
      ['A 15.0 g sample occupies 3.0 mL. Report its density.',['5.0 g/mL','5.00 g/mL','0.20 g/mL','45 g/mL'],0,'15.0 / 3.0 = 5.0 g/mL, limited to two significant figures.']
    ],
    'atoms-moles': [
      null,
      ['Why are carbon-12 and carbon-14 both carbon?',['Same neutron count','Same proton count','Same mass number','Same number of neutrons and electrons'],1,'An element is defined by its proton count. Isotopes differ in neutron count.'],
      ['How many moles are in 24.0 g of carbon if its molar mass is 12.0 g/mol?',['0.500 mol','2.00 mol','12.0 mol','288 mol'],1,'24.0 g × (1 mol / 12.0 g) = 2.00 mol.','measurement',2],
      ['An element is 75% isotope X (mass 10 u) and 25% isotope Y (mass 12 u). Its average mass is…',['10.0 u','10.5 u','11.0 u','12.0 u'],1,'Use the weighted average: 0.75 × 10 + 0.25 × 12 = 10.5 u.'],
      ['Which conversion correctly counts atoms in 2.00 mol of a monatomic element?',['Divide by Avogadro’s constant','Multiply by molar mass only','Multiply by 6.022 × 10²³ atoms/mol','Multiply by the atomic number'],2,'The mole unit cancels, leaving atoms: about 1.20 × 10²⁴ atoms. This reuses dimensional analysis.','measurement',2],
      ['A neutral atom has 12 protons and 13 neutrons. Its mass number is…',['1','12','13','25'],3,'Mass number counts protons plus neutrons: 12 + 13 = 25.']
    ],
    formulas: [
      ['Which formula represents an ionic compound?',['CO₂','NaCl','CH₄','O₂'],1,'NaCl consists of sodium cations and chloride anions; the other choices are molecular substances.'],
      ['Why is FeCl₃ named iron(III) chloride?',['There are three iron atoms','Iron has a +3 charge in this compound','Chlorine has a +3 charge','The Roman numeral is the total atom count'],1,'Each chloride is −1. Three chlorides require Fe³⁺ for a neutral formula.'],
      null,
      ['What is the formula for calcium nitrate?',['CaNO₃','Ca₂NO₃','Ca(NO₃)₂','Ca₂(NO₃)₃'],2,'Ca²⁺ requires two NO₃⁻ ions. Parentheses keep the polyatomic ion intact.'],
      ['A sample contains 0.10 mol C and 0.20 mol H atoms. What empirical formula follows?',['CH','CH₂','C₂H','C₂H₂'],1,'Divide both mole amounts by 0.10 to find the simplest atom ratio, 1:2.','atoms-moles',2],
      ['What is the name of Cu₂O, assuming oxide is O²⁻?',['Copper(II) oxide','Copper(I) oxide','Copper dioxide','Copper(III) oxide'],1,'Two copper ions balance one oxide ion, so each copper is +1: copper(I) oxide.']
    ],
    stoichiometry: [
      ['What must a balanced chemical equation conserve?',['The number of molecules','The number of atoms of each element','The volume of every substance','The physical state'],1,'Atoms are rearranged, not created or destroyed, in an ordinary chemical reaction.'],
      ['Why should you balance an equation by changing coefficients instead of subscripts?',['Subscripts are always 1','Changing a subscript changes the chemical substance','Coefficients change the element identity','Subscripts do not affect atom counts'],1,'A subscript defines composition. Changing H₂O to H₂O₂ creates a different substance.','formulas',0],
      null,
      ['For 2H₂ + O₂ → 2H₂O, 3 mol H₂ and 2 mol O₂ can form at most…',['2 mol H₂O','3 mol H₂O','4 mol H₂O','5 mol H₂O'],1,'H₂ limits the reaction: 3 mol H₂ yields 3 mol H₂O and uses 1.5 mol O₂.'],
      ['For 2Mg + O₂ → 2MgO, 4.8 g Mg reacts with excess oxygen. Use Mg = 24 g/mol and MgO = 40 g/mol. What mass of MgO forms?',['2.9 g','4.8 g','8.0 g','40 g'],2,'4.8 g / 24 g mol⁻¹ = 0.20 mol Mg. The 1:1 mole ratio gives 0.20 mol MgO × 40 g/mol = 8.0 g.','atoms-moles',2],
      ['An experiment produces 6.0 g when the theoretical yield is 8.0 g. What is the percent yield?',['25%','75%','80%','133%'],1,'Percent yield = actual / theoretical × 100 = 6.0 / 8.0 × 100 = 75%.']
    ],
    aqueous: [
      ['Which particles carry electric current in an aqueous NaCl solution?',['Mobile ions','Only neutral NaCl molecules','Stationary atoms','Photons'],0,'Dissolved Na⁺ and Cl⁻ ions move through the solution and carry charge.'],
      ['Why do spectator ions disappear from a net ionic equation?',['They cease to exist','They are identical on both sides and do not undergo the net change','They always form a gas','Their charges are zero'],1,'Spectator ions remain dissolved and cancel because they occur unchanged on both sides.'],
      null,
      ['Mix AgNO₃(aq) and NaCl(aq). Which is the net ionic equation for the precipitate?',['Na⁺ + NO₃⁻ → NaNO₃(s)','Ag⁺ + Cl⁻ → AgCl(s)','Ag⁺ + Na⁺ → AgNa(s)','AgNO₃ → Ag + NO₃'],1,'AgCl is sparingly soluble. Sodium and nitrate remain spectator ions.'],
      ['For Zn + Cu²⁺ → Zn²⁺ + Cu, how many electrons does each Zn atom lose, and why?',['One, because there is one Zn atom','Two, because its charge increases from 0 to +2','Two, because Cu gains protons','None, because mass is conserved'],1,'Losing two negative electrons produces Zn²⁺. Charge bookkeeping connects ion formation to oxidation.','atoms-moles',0],
      ['In Mg(s) + 2H⁺(aq) → Mg²⁺(aq) + H₂(g), what is reduced?',['Mg','H⁺','Mg²⁺','Nothing'],1,'H⁺ gains electrons to become H₂, changing hydrogen’s oxidation state from +1 to 0.']
    ],
    thermochemistry: [
      null,
      ['If a reaction warms the surrounding water, the reaction system usually…',['absorbs heat from that water','releases heat to that water','has no energy change','must have positive ΔH'],1,'Heat gained by the surroundings is lost by the system, if other heat transfers are negligible.'],
      ['How much heat warms 10.0 g water by 5.00 °C? Use c = 4.18 J/(g·°C).',['8.36 J','20.9 J','209 J','2090 J'],2,'q = mcΔT = 10.0 × 4.18 × 5.00 = 209 J.'],
      ['Reversing a reaction changes ΔH = −50 kJ to…',['−100 kJ','−50 kJ','0 kJ','+50 kJ'],3,'Enthalpy is a state function. Reversing the direction reverses the sign of the change.'],
      ['A reaction releases 100 kJ per mole of reaction as written. What is ΔH for twice that reaction?',['−200 kJ','−100 kJ','+100 kJ','+200 kJ'],0,'Doubling all stoichiometric coefficients doubles the enthalpy change. Release is negative for the system.','stoichiometry',1],
      ['A system absorbs 30 J heat and does 10 J work on its surroundings. Using ΔU = q + w, ΔU is…',['−40 J','−20 J','+20 J','+40 J'],2,'q = +30 J and w = −10 J, so ΔU = +20 J.']
    ],
    electronic: [
      null,
      ['An atomic orbital describes…',['an exact circular electron path','a region described by an electron probability distribution','a proton orbit','a fixed electron speed'],1,'Orbitals describe probability distributions, rather than classical fixed paths.'],
      ['What is the maximum number of electrons in a p subshell?',['2','3','6','10'],2,'Three p orbitals can each contain two electrons, for six in total.'],
      ['If a photon’s frequency doubles, its energy…',['halves','stays constant','doubles','quadruples'],2,'E = hν: photon energy is proportional to frequency.'],
      ['A neutral sodium atom has 11 electrons. Forming Na⁺ primarily removes…',['a 1s electron','the outer 3s electron','a proton','a neutron'],1,'Na has configuration [Ne]3s¹. Removing the outer electron leaves ten electrons while its eleven protons preserve sodium’s identity.','atoms-moles',0],
      ['Compared with red light, higher-frequency violet light has photons with…',['less energy','the same energy','more energy','zero energy'],2,'Photon energy E = hν increases with frequency.']
    ],
    periodic: [
      ['Elements in the same main-group column tend to share…',['the same mass','similar valence-electron patterns','the same neutron number','identical atomic radii'],1,'Similar valence configurations help explain recurring chemical behavior.'],
      ['Why does atomic radius generally decrease across a period?',['Nuclear attraction increases while electrons enter the same principal shell','Protons are lost','All shielding disappears','Electrons enter successively higher principal shells'],0,'Increasing effective nuclear attraction generally pulls electrons in the same shell closer.'],
      null,
      ['Which neutral atom is usually larger: Li or K?',['Li, because it is lighter','K, because its outer electron occupies a higher principal shell','They are identical','Cannot compare elements in one group'],1,'Down a group, added principal shells generally increase atomic size.'],
      ['Why does Na commonly form Na⁺ while Cl commonly forms Cl⁻?',['Both lose protons','Their valence configurations favor losing one versus gaining one electron','They must have equal masses','Both gain one electron'],1,'Na is [Ne]3s¹; Cl is [Ne]3s²3p⁵. Electron transfer can produce filled valence shells while balancing opposite charges.','electronic',2],
      ['Which bond is expected to have the largest electronegativity difference?',['C–C','N–N','H–H','H–F'],3,'Identical atoms have zero electronegativity difference. Fluorine attracts shared electrons much more strongly than hydrogen.']
    ],
    bonding: [
      ['A covalent bond involves…',['shared electron density between atoms','transfer of neutrons','destruction of electrons','shared atomic nuclei'],0,'Covalent bonding involves shared electron density that stabilizes the bonded arrangement.'],
      null,
      ['How many valence electrons belong in a Lewis structure of CO₂?',['8','12','16','22'],2,'Carbon contributes 4 and each oxygen 6: 4 + 2 × 6 = 16.','periodic',0],
      ['Which change is allowed between valid resonance contributors?',['Moving atoms to new positions','Moving electron pairs while keeping atom connectivity','Changing the total electron count','Changing the total charge'],1,'Resonance changes electron bookkeeping, not nuclei, connectivity, total electrons, or total charge.'],
      ['An oxygen atom has three lone pairs and one single bond. Its formal charge is…',['−1','0','+1','+2'],0,'Formal charge = 6 − 6 − 1 = −1. The six valence electrons expected for oxygen come from its group.','periodic',0],
      ['A nitrogen atom with four single bonds and no lone pairs has formal charge…',['−1','0','+1','+4'],2,'Formal charge = 5 − 0 − 4 = +1, as for nitrogen in NH₄⁺.']
    ],
    geometry: [
      ['In VSEPR, a double bond counts as how many electron domains around a central atom?',['1','2','3','4'],0,'Each bonding region, whether single, double, or triple, counts as one electron domain.'],
      ['Why is water bent rather than linear?',['Oxygen has two bonding domains and two lone pairs','The O–H bonds are nonpolar','Hydrogen has lone pairs','All three-atom molecules are bent'],0,'Four electron domains have approximately tetrahedral arrangement; two are lone pairs, leaving bent molecular geometry.','bonding',1],
      null,
      ['A central atom has three bonding domains and no lone pairs. The molecular geometry is…',['linear','trigonal planar','tetrahedral','trigonal pyramidal'],1,'Three electron domains arrange approximately 120° apart in a plane.'],
      ['Which sequence best predicts molecular polarity?',['Count atoms only','Find Lewis structure, infer shape, then combine bond dipoles','Use molar mass only','Assume every polar bond makes a polar molecule'],1,'Lewis electron bookkeeping identifies lone pairs; VSEPR gives shape; the vector sum of dipoles determines molecular polarity.','bonding',1],
      ['NH₃ has three N–H bonds and one lone pair on N. Its molecular geometry is…',['trigonal planar','linear','trigonal pyramidal','square planar'],2,'Four electron domains give tetrahedral electron geometry, but the positions of the three atoms define a trigonal pyramid.']
    ],
    gases: [
      ['Which temperature scale belongs in PV = nRT?',['Celsius','Fahrenheit','Kelvin','Any scale without conversion'],2,'The ideal-gas law uses absolute temperature in kelvin.'],
      null,
      ['At fixed amount and temperature, reducing ideal-gas volume from 4.0 L to 2.0 L changes pressure from 1.0 atm to…',['0.50 atm','1.0 atm','2.0 atm','4.0 atm'],2,'Boyle’s law gives P₁V₁ = P₂V₂, so P₂ = 2.0 atm.'],
      ['Why do real gases deviate most from ideal behavior at high pressure and low temperature?',['Particle volume and attractions become more important','Particles become massless','Gas particles stop moving entirely','The gas constant becomes zero'],0,'Close spacing and lower kinetic energy make finite particle volume and intermolecular attractions significant.'],
      ['An ideal mixture contains 1 mol He and 3 mol Ne at total pressure 4 atm. What is the He partial pressure?',['1 atm','2 atm','3 atm','4 atm'],0,'Mole fraction He = 1/(1 + 3) = 0.25; PHe = 0.25 × 4 = 1 atm.','atoms-moles',2],
      ['Equal amounts of two ideal gases at the same temperature and pressure occupy…',['equal volumes','volumes proportional to molar mass','zero volume','unpredictable volumes'],0,'PV = nRT contains amount, temperature, and pressure, not gas identity.']
    ],
    imf: [
      ['Which attraction is present between all atoms and molecules?',['Hydrogen bonding','London dispersion','Ionic bonding','Metallic bonding'],1,'Fluctuating electron distributions produce dispersion attractions even in nonpolar particles.'],
      ['Why can water molecules hydrogen-bond to each other?',['They contain any hydrogen atom','Their H atoms are bonded to O, and O has lone pairs','They contain ionic H⁺ only','All bent molecules hydrogen-bond'],1,'Hydrogen bonding involves H attached to N, O, or F interacting with a suitable lone pair.','geometry',1],
      null,
      ['At the same temperature, a liquid with stronger attractions generally has…',['higher vapor pressure','lower vapor pressure','no liquid phase','a lower boiling point'],1,'Stronger attractions make escape into the vapor less favorable, reducing vapor pressure.'],
      ['CO₂ is nonpolar but condenses at sufficiently low temperature. What explains the attraction?',['Nonpolar molecules cannot attract','Its electrons create London dispersion forces','It must contain permanent molecular dipoles','Its C=O bonds must be ionic'],1,'Cancellation of permanent bond dipoles does not eliminate fluctuating electron distributions and dispersion.','geometry',1],
      ['Melting ice primarily disrupts…',['O–H covalent bonds within every molecule','some intermolecular hydrogen-bond organization','oxygen nuclei','all electrons'],1,'Phase changes reorganize intermolecular attractions while preserving the water molecules.']
    ],
    solutions: [
      ['Molarity is defined as…',['moles solute per liter of solution','grams solute per liter of solvent','moles solute per kilogram of solvent','liters solute per mole'],0,'M = nsolute / Vsolution in liters. Molality instead uses kilograms of solvent.'],
      ['Why does dissolving NaCl ideally affect freezing point more than dissolving the same molal amount of glucose?',['NaCl has larger molecules','NaCl dissociates into more dissolved particles','Glucose always precipitates','NaCl changes the solvent mass to zero'],1,'Colligative properties depend on particle concentration. NaCl ideally produces two ions per formula unit.','aqueous',0],
      ['What is the molarity of 0.20 mol solute in 0.50 L of solution?',['0.10 M','0.40 M','2.5 M','4.0 M'],1,'M = 0.20 mol / 0.50 L = 0.40 mol/L.'],
      null,
      ['How much 2.0 M stock is needed to prepare 100 mL of 0.50 M solution?',['10 mL','25 mL','50 mL','400 mL'],1,'Conserving solute moles gives M₁V₁ = M₂V₂, so V₁ = 25 mL. Dilute to a final volume of 100 mL.','measurement',2],
      ['Diluting a solution with pure solvent, without loss of solute, changes…',['solute moles and concentration equally','concentration but not solute moles','solute identity','moles of every solute to zero'],1,'Adding solvent increases volume while preserving solute amount, so molarity decreases.']
    ],
    kinetics: [
      ['Reaction rate describes…',['how fast concentrations change','the final equilibrium ratio alone','whether ΔG is negative','the total mass only'],0,'Kinetics concerns how quickly a reaction proceeds; equilibrium concerns its eventual composition.'],
      null,
      ['For rate = k[A]², doubling [A] at fixed temperature changes the rate by a factor of…',['1/2','2','4','8'],2,'The concentration is squared: (2[A])² = 4[A]².'],
      ['Can the rate-law exponents for an overall multistep reaction always be read from its balanced equation?',['Yes, for all reactions','No; the rate law generally requires experimental evidence','Only if coefficients are integers','Only for aqueous reactions'],1,'Overall stoichiometry need not describe the mechanism or rate-determining events.'],
      ['A reaction releases heat but proceeds slowly at room temperature. Which explanation fits?',['Negative ΔH guarantees high speed','It can have a substantial activation barrier','Energy conservation has failed','A balanced equation specifies its speed'],1,'Thermochemistry tracks energy differences between states; kinetics depends on the pathway and activation barrier.','thermochemistry',1],
      ['A catalyst is added to a reaction mixture at equilibrium. What happens?',['Only the forward reaction becomes faster','The equilibrium constant increases','Both directions can become faster, with no change to K','Products must become 100%'],2,'The catalyst speeds equilibration in both directions without changing equilibrium thermodynamics.']
    ],
    equilibrium: [
      ['At dynamic equilibrium…',['both reaction rates are zero','forward and reverse rates are equal','reactant and product concentrations must be equal','all reactants are consumed'],1,'Both directions continue at equal rates, giving constant macroscopic composition.'],
      null,
      ['If Q < K, which net direction moves a reaction toward equilibrium?',['Toward products','Toward reactants','Neither direction','Cannot determine without a catalyst'],0,'The current product-to-reactant ratio is too small, so net forward reaction increases Q.'],
      ['For N₂(g) + 3H₂(g) ⇌ 2NH₃(g), compression at fixed temperature favors…',['reactants, with more gas moles','products, with fewer gas moles','neither side under any conditions','a larger K'],1,'Reducing volume favors the side with fewer gas particles: two product moles versus four reactant moles.','gases',0],
      ['Why does adding a catalyst not shift the equilibrium composition?',['It stops both reactions','It changes rates in both directions without changing their thermodynamic endpoint','It changes only product mass','It makes K zero'],1,'A catalyst changes pathways and equilibration speed, not the free-energy difference between reactants and products.','kinetics',2],
      ['For A ⇌ B, K = 4. If [A] = 0.20 M and [B] = 0.40 M, the mixture…',['has Q = 2 and proceeds toward B','has Q = 4 and is at equilibrium','has Q = 0.5 and proceeds toward A','has Q = 8 and proceeds toward A'],0,'Q = [B]/[A] = 2 < 4, so net conversion of A to B moves toward equilibrium.']
    ],
    acidbase: [
      ['A Brønsted–Lowry acid is a…',['proton donor','proton acceptor','neutron donor','species that must contain oxygen'],0,'The Brønsted–Lowry definition describes transfer of H⁺ from an acid to a base.'],
      ['Which pair can form a buffer in appreciable amounts?',['HCl and NaCl','CH₃COOH and CH₃COO⁻','NaCl and KCl','Pure water and sugar'],1,'A weak acid and its conjugate base can consume small additions of base and acid, respectively.'],
      ['What is the pH if [H₃O⁺] = 1.0 × 10⁻³ M?',['−3','3','7','11'],1,'pH = −log₁₀[H₃O⁺] = 3.00 in the usual dilute-solution approximation.'],
      null,
      ['Adding a little strong acid to an acetate/acetic-acid buffer primarily…',['uses acetate to form more acetic acid','destroys all buffer instantly','changes Ka at fixed temperature','forms more OH⁻ without reaction'],0,'H⁺ reacts with the conjugate base, shifting the acid–base equilibrium. Ka stays constant at fixed temperature.','equilibrium',2],
      ['At pH = pKa, the buffer ratio [A⁻]/[HA] is…',['0.1','1','10','100'],1,'Henderson–Hasselbalch gives 0 = log([A⁻]/[HA]), so the ratio is 1.']
    ],
    solubility: [
      ['Ksp describes equilibrium between…',['a sparingly soluble solid and its dissolved ions','two ideal gases only','an acid and light','all solutes and all solvents with one universal value'],0,'The solubility product describes a specified solid’s dissolution equilibrium at a given temperature.'],
      ['Why is solid AgCl omitted from Ksp = [Ag⁺][Cl⁻]?',['It has no atoms','Its pure-solid activity is treated as 1','Its charge is positive','It never dissolves'],1,'Pure solids have unit activity in the equilibrium convention; dissolved ion activities determine Ksp.'],
      null,
      ['For CaF₂(s) ⇌ Ca²⁺ + 2F⁻ with molar solubility s in pure water, Ksp is ideally…',['s²','2s²','4s³','s³/4'],2,'[Ca²⁺] = s and [F⁻] = 2s, so Ksp = s(2s)² = 4s³.','stoichiometry',1],
      ['Why can adding acid increase the solubility of a carbonate solid?',['H⁺ consumes carbonate through acid–base reactions','Acid always increases every solid’s Ksp','H⁺ adds a common carbonate ion','The solid loses its atoms'],0,'Consuming CO₃²⁻ couples acid–base and dissolution equilibria and can pull further dissolution.','acidbase',0],
      ['A mixture has Qsp > Ksp. Which change is thermodynamically favored?',['More dissolution only','Precipitation until the ion product falls toward Ksp','No change under any conditions','An automatic increase of Ksp'],1,'The ion product exceeds its equilibrium value, so forming solid reduces dissolved ion concentrations.']
    ],
    thermodynamics: [
      ['At constant temperature and pressure, a spontaneous forward change has…',['ΔG < 0','ΔG > 0','zero activation energy','infinite speed'],0,'Gibbs free energy decreases for a spontaneous change at fixed temperature and pressure.'],
      null,
      ['For ΔH = +20 kJ/mol and ΔS = +100 J/(mol·K), ΔG at 300 K is…',['+50 kJ/mol','+20 kJ/mol','−10 kJ/mol','−30000 kJ/mol'],2,'Convert ΔS to 0.100 kJ/(mol·K): ΔG = 20 − 300 × 0.100 = −10 kJ/mol.','measurement',2],
      ['A process has ΔH > 0 and ΔS > 0. It is favored by…',['lower temperature in all cases','higher temperature when TΔS exceeds ΔH','no temperature','negative absolute temperature'],1,'ΔG = ΔH − TΔS becomes negative when the positive entropy contribution outweighs the enthalpy cost.'],
      ['A mixture is at equilibrium even though ΔG° ≠ 0. Which statement is consistent?',['Actual ΔG = 0 and Q = K','Actual ΔG must equal ΔG°','Q must equal 1','The reaction must stop microscopically'],0,'ΔG = ΔG° + RT ln Q. At Q = K, the terms sum to zero; standard-state ΔG° need not be zero.','equilibrium',1],
      ['If ΔG° = 0 at a given temperature, K equals…',['0','1','10','infinity'],1,'ΔG° = −RT ln K gives ln K = 0, so K = 1.']
    ],
    electrochem: [
      ['Oxidation occurs at the…',['anode','cathode','salt bridge only','voltmeter only'],0,'The anode is defined as the electrode at which oxidation occurs, in both galvanic and electrolytic cells.'],
      null,
      ['Using standard reduction potentials +0.34 V (Cu²⁺/Cu) and −0.76 V (Zn²⁺/Zn), E° for the spontaneous Zn/Cu cell is…',['−1.10 V','−0.42 V','+0.42 V','+1.10 V'],3,'E°cell = E°cathode − E°anode = 0.34 − (−0.76) = +1.10 V.'],
      ['Why is a salt bridge useful?',['It carries electrons through the solution','Its ions maintain electrical neutrality as the half-reactions proceed','It prevents all ion motion','It changes every cell potential to zero'],1,'Ionic motion counteracts charge buildup; electrons travel through the external circuit.','aqueous',0],
      ['What does positive E°cell imply about ΔG° and K?',['ΔG° > 0 and K < 1','ΔG° < 0 and K > 1','ΔG° = 0 and K = 1','Nothing about either'],1,'ΔG° = −nFE°cell is negative, and ΔG° = −RT ln K then requires K > 1.','thermodynamics',2],
      ['Multiplying an entire balanced cell reaction by 2 changes E°cell how?',['It doubles','It halves','It is unchanged','Its sign reverses'],2,'Both ΔG° and transferred electron amount n double, so E° = −ΔG°/(nF) is unchanged.']
    ]
  };
  const sections = {measurement:[0,1,1,2,2,2],'atoms-moles':[0,0,2,1,2,0],formulas:[0,1,0,1,2,1],stoichiometry:[0,0,1,2,1,2],aqueous:[0,1,2,1,2,2],thermochemistry:[1,0,2,1,1,0],electronic:[1,1,1,0,2,0],periodic:[0,0,1,0,0,2],bonding:[0,2,1,2,1,1],geometry:[0,0,1,0,1,0],gases:[0,0,0,2,1,0],imf:[0,1,2,2,0,2],solutions:[1,2,1,2,1,1],kinetics:[0,2,1,1,0,2],equilibrium:[0,2,1,2,0,1],acidbase:[0,2,1,2,2,2],solubility:[0,0,1,0,1,0],thermodynamics:[1,2,1,1,2,2],electrochem:[0,0,1,0,1,1]};
  const levels = ['Recognize','Explain','Apply','Reason','Connect','Reinforce'];
  window.ChemAtlasChecks = {
    questions(module) {
      if (Array.isArray(module.checks) && module.checks.length >= 3) return module.checks;
      const bank = banks[module.id];
      if (!bank) return module.check ? [{...module.check,id:module.id+'-legacy',level:'Apply'}] : [];
      return bank.map((row,i) => ({
        ...(row ? {question:row[0],choices:row[1],answer:row[2],explanation:row[3],
          callback:row[4] ? {moduleId:row[4],section:row[5]||0} : undefined} : module.check),
        id:module.id+'-'+(i+1),level:levels[i],section:sections[module.id][i]
      }));
    }
  };
})();
