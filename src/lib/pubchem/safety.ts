import axios from 'axios';

const PUG_VIEW_BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound';
const REQUEST_TIMEOUT = 10000;

export interface SafetyData {
  hazardClass?: string;
  flashPoint?: string;
  autoignition?: string;
  ld50?: string;
  oralLd50?: string;
  dermalLd50?: string;
  inhalationLc50?: string;
  nfpaRating?: string;
  ghsClassification?: string;
  flammability?: string;
  healthHazards?: string;
  fireHazards?: string;
  firstAid?: {
    inhalation?: string;
    skin?: string;
    eye?: string;
    ingestion?: string;
  };
  exposureLimits?: {
    rel?: string;
    pel?: string;
    tlv?: string;
    idlh?: string;
  };
  personalProtection?: {
    skin?: string;
    eye?: string;
    respiratory?: string;
  };
  storage?: string;
  disposal?: string;
  incompatibilities?: string;
}

export async function getSafetyDataByCID(cid: number): Promise<SafetyData | null> {
  if (!cid) {
    return null;
  }

  const url = `${PUG_VIEW_BASE}/${cid}/JSON`;

  try {
    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = response.data;
    
    // Find Safety and Hazards section
    const safetySection = data.Record?.Section?.find((section: any) => 
      section.TOCHeading === 'Safety and Hazards'
    );

    if (!safetySection?.Section) {
      return null;
    }

    // Helper function to find specific properties
    const findProperty = (sections: any[], propertyName: string): string | undefined => {
      for (const section of sections) {
        if (section.Information) {
          for (const info of section.Information) {
            if (info.Name && info.Name.toLowerCase().includes(propertyName.toLowerCase())) {
              return info.Value?.StringWithMarkup?.[0]?.String || 
                     info.Value?.String || 
                     info.Value?.Number?.toString() || 
                     undefined;
            }
          }
        }
        if (section.Section) {
          const result = findProperty(section.Section, propertyName);
          if (result !== undefined) return result;
        }
      }
      return undefined;
    };

    // Extract safety data
    const safetyData: SafetyData = {};

    // Basic hazard information
    safetyData.hazardClass = findProperty(safetySection.Section, 'hazard class') || 
                            findProperty(safetySection.Section, 'hazard classes') ||
                            undefined;
    
    safetyData.flashPoint = findProperty(safetySection.Section, 'flash point') ||
                           findProperty(safetySection.Section, 'flashpoint') ||
                           undefined;

    safetyData.autoignition = findProperty(safetySection.Section, 'autoignition') ||
                             findProperty(safetySection.Section, 'autoignition temperature') ||
                             undefined;

    safetyData.ld50 = findProperty(safetySection.Section, 'ld50') ||
                     findProperty(safetySection.Section, 'oral ld50') ||
                     undefined;

    safetyData.nfpaRating = findProperty(safetySection.Section, 'nfpa') ||
                           findProperty(safetySection.Section, 'nfpa rating') ||
                           undefined;

    safetyData.ghsClassification = findProperty(safetySection.Section, 'ghs') ||
                                  findProperty(safetySection.Section, 'ghs classification') ||
                                  undefined;

    safetyData.flammability = findProperty(safetySection.Section, 'flammability') ||
                             findProperty(safetySection.Section, 'flammable') ||
                             undefined;

    safetyData.healthHazards = findProperty(safetySection.Section, 'health hazards') ||
                              findProperty(safetySection.Section, 'hazards summary') ||
                              undefined;

    safetyData.fireHazards = findProperty(safetySection.Section, 'fire hazards') ||
                            findProperty(safetySection.Section, 'fire potential') ||
                            undefined;

    // First aid measures
    const firstAidSection = safetySection.Section.find((s: any) => s.TOCHeading === 'First Aid Measures');
    if (firstAidSection?.Section) {
      safetyData.firstAid = {
        inhalation: findProperty(firstAidSection.Section, 'inhalation') ||
                   findProperty(firstAidSection.Section, 'inhalation first aid') ||
                   undefined,
        skin: findProperty(firstAidSection.Section, 'skin') ||
              findProperty(firstAidSection.Section, 'skin first aid') ||
              undefined,
        eye: findProperty(firstAidSection.Section, 'eye') ||
             findProperty(firstAidSection.Section, 'eye first aid') ||
             undefined,
        ingestion: findProperty(firstAidSection.Section, 'ingestion') ||
                  findProperty(firstAidSection.Section, 'ingestion first aid') ||
                  undefined,
      };
    }

    // Exposure control
    const exposureSection = safetySection.Section.find((s: any) => s.TOCHeading === 'Exposure Control and Personal Protection');
    if (exposureSection?.Section) {
      safetyData.exposureLimits = {
        rel: findProperty(exposureSection.Section, 'rel') ||
             findProperty(exposureSection.Section, 'recommended exposure limit') ||
             undefined,
        pel: findProperty(exposureSection.Section, 'pel') ||
             findProperty(exposureSection.Section, 'permissible exposure limit') ||
             undefined,
        tlv: findProperty(exposureSection.Section, 'tlv') ||
             findProperty(exposureSection.Section, 'threshold limit value') ||
             undefined,
        idlh: findProperty(exposureSection.Section, 'idlh') ||
              findProperty(exposureSection.Section, 'immediately dangerous to life') ||
              undefined,
      };

      safetyData.personalProtection = {
        skin: findProperty(exposureSection.Section, 'skin prevention') ||
              findProperty(exposureSection.Section, 'protective clothing') ||
              undefined,
        eye: findProperty(exposureSection.Section, 'eye prevention') ||
             findProperty(exposureSection.Section, 'eye protection') ||
             undefined,
        respiratory: findProperty(exposureSection.Section, 'inhalation prevention') ||
                    findProperty(exposureSection.Section, 'respirator') ||
                    undefined,
      };
    }

    // Handling and storage
    const handlingSection = safetySection.Section.find((s: any) => s.TOCHeading === 'Handling and Storage');
    if (handlingSection?.Section) {
      safetyData.storage = findProperty(handlingSection.Section, 'storage') ||
                          findProperty(handlingSection.Section, 'safe storage') ||
                          findProperty(handlingSection.Section, 'storage conditions') ||
                          undefined;
    }

    // Disposal
    const disposalSection = safetySection.Section.find((s: any) => s.TOCHeading === 'Accidental Release Measures');
    if (disposalSection?.Section) {
      safetyData.disposal = findProperty(disposalSection.Section, 'disposal') ||
                           findProperty(disposalSection.Section, 'spillage disposal') ||
                           findProperty(disposalSection.Section, 'disposal methods') ||
                           undefined;
    }

    // Incompatibilities
    const stabilitySection = safetySection.Section.find((s: any) => s.TOCHeading === 'Stability and Reactivity');
    if (stabilitySection?.Section) {
      safetyData.incompatibilities = findProperty(stabilitySection.Section, 'incompatibilities') ||
                                    findProperty(stabilitySection.Section, 'hazardous reactivities') ||
                                    findProperty(stabilitySection.Section, 'reactive group') ||
                                    undefined;
    }

    // Also check Toxicity section for LD50 values
    const toxicitySection = data.Record?.Section?.find((section: any) => 
      section.TOCHeading === 'Toxicity'
    );

    if (toxicitySection?.Section) {
      safetyData.oralLd50 = findProperty(toxicitySection.Section, 'oral ld50') ||
                           findProperty(toxicitySection.Section, 'oral toxicity') ||
                           undefined;
      
      safetyData.dermalLd50 = findProperty(toxicitySection.Section, 'dermal ld50') ||
                             findProperty(toxicitySection.Section, 'dermal toxicity') ||
                             undefined;
      
      safetyData.inhalationLc50 = findProperty(toxicitySection.Section, 'inhalation lc50') ||
                                 findProperty(toxicitySection.Section, 'inhalation toxicity') ||
                                 undefined;
    }

    return safetyData;

  } catch (error) {
    console.error('[PubChem Safety] Error fetching safety data:', error);
    return null;
  }
}