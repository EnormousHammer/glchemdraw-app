/**
 * PREMIUM ENTERPRISE Compound Info Display
 * With CAS Number, Copy All buttons, and ALL data visible
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  alpha,
  Button,
} from '@mui/material';
import {
  CheckCircle,
  ContentCopy,
  ExpandMore,
  OpenInNew,
  Science,
  Fingerprint,
  Biotech,
  Category,
  ThreeDRotation,
  CopyAll,
} from '@mui/icons-material';
import type { SearchResult } from '@lib/pubchem/cache';

interface CompoundInfoCompactProps {
  compound: SearchResult;
}

export const CompoundInfoCompact: React.FC<CompoundInfoCompactProps> = ({ compound }) => {
  const { cid, properties, summary, casNumber, fromCache } = compound;
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['identifiers', 'physicochemical', 'structure']));
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string = '') => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const copySection = async (sectionName: string, data: Record<string, any>) => {
    const text = Object.entries(data)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    await copyToClipboard(text, sectionName);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const DataRow = ({ label, value, unit = '', copiable = true }: any) => (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        py: 1.5,
        px: 2,
        borderRadius: 1.5,
        bgcolor: 'background.paper',
        mb: 1,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s',
        '&:hover': {
          bgcolor: 'action.hover',
          borderColor: 'primary.light',
          '& .copy-icon': {
            opacity: 1,
          }
        }
      }}
    >
      <Typography 
        variant="body2" 
        sx={{ 
          color: 'text.secondary', 
          fontSize: '0.8rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography 
          variant="body1" 
          sx={{ 
            fontWeight: 700, 
            fontSize: '0.9rem',
            color: 'text.primary',
          }}
        >
          {value}{unit}
        </Typography>
        {copiable && (
          <Tooltip title={copied === label ? "Copied!" : "Copy"}>
            <IconButton
              className="copy-icon"
              size="small"
              onClick={() => copyToClipboard(`${value}${unit}`, label)}
              sx={{
                opacity: 0,
                transition: 'opacity 0.2s',
                p: 0.5,
              }}
            >
              <ContentCopy sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );

  const SectionHeader = ({ icon, title, sectionKey, count = 0, color = 'primary.main', onCopyAll }: any) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        bgcolor: expandedSections.has(sectionKey) ? alpha(color, 0.08) : 'transparent',
        borderRadius: 2,
        transition: 'all 0.2s',
        mb: 1,
      }}
    >
      <Box 
        onClick={() => toggleSection(sectionKey)}
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          flex: 1,
          cursor: 'pointer',
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            bgcolor: alpha(color, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 20, color } })}
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
          {title}
        </Typography>
        {count > 0 && (
          <Chip 
            label={count} 
            size="small" 
            sx={{ 
              height: 22, 
              fontSize: '0.7rem',
              fontWeight: 700,
              bgcolor: alpha(color, 0.15),
              color: color,
            }} 
          />
        )}
        <Box sx={{ flex: 1 }} />
        <ExpandMore
          sx={{
            fontSize: 24,
            transform: expandedSections.has(sectionKey) ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s',
            color: color,
          }}
        />
      </Box>
      {onCopyAll && (
        <Tooltip title="Copy all data from this section">
          <Button
            size="small"
            startIcon={<CopyAll sx={{ fontSize: 16 }} />}
            onClick={onCopyAll}
            sx={{
              ml: 1,
              fontSize: '0.7rem',
              textTransform: 'none',
              minWidth: 'auto',
            }}
          >
            {copied === title ? 'Copied!' : 'Copy All'}
          </Button>
        </Tooltip>
      )}
    </Box>
  );

  const CodeBlock = ({ value, label, onCopy }: any) => (
    <Box
      sx={{
        position: 'relative',
        bgcolor: alpha('#667eea', 0.05),
        border: '2px solid',
        borderColor: alpha('#667eea', 0.15),
        borderRadius: 2,
        p: 2,
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        wordBreak: 'break-all',
        color: 'text.primary',
        lineHeight: 1.6,
        '&:hover .copy-btn': {
          opacity: 1,
        }
      }}
    >
      {value}
      <Tooltip title={copied === label ? "Copied!" : "Copy"}>
        <IconButton
          className="copy-btn"
          size="small"
          onClick={onCopy}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            opacity: 0,
            transition: 'opacity 0.2s',
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': {
              bgcolor: 'primary.main',
              color: 'white',
            }
          }}
        >
          <ContentCopy sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f5f7fa' }}>
      {/* Compact Premium Header with CAS Number */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 2,
          color: 'white',
          boxShadow: '0 4px 24px rgba(102, 126, 234, 0.4)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              bgcolor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <CheckCircle sx={{ fontSize: 22 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75, flexWrap: 'wrap' }}>
              <Chip
                label={`CID ${cid}`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.25)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  height: 22,
                  backdropFilter: 'blur(10px)',
                }}
              />
              {casNumber && (
                <Chip
                  label={`CAS ${casNumber}`}
                  size="small"
                  icon={<ContentCopy sx={{ fontSize: 14, color: 'white !important' }} />}
                  onClick={() => copyToClipboard(casNumber, 'CAS')}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    height: 22,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                    }
                  }}
                />
              )}
              {fromCache && (
                <Chip
                  label="Cached"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    fontSize: '0.65rem',
                    height: 20,
                  }}
                />
              )}
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '1rem',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              {properties.IUPACName || properties.Title || `Compound ${cid}`}
            </Typography>
          </Box>
          <Tooltip title="View on PubChem">
            <IconButton
              size="small"
              href={`https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`}
              target="_blank"
              sx={{ 
                color: 'white', 
                p: 0.75,
                bgcolor: 'rgba(255,255,255,0.15)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.25)',
                }
              }}
            >
              <OpenInNew sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Scrollable Content with Better Spacing */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>
        {/* Premium Key Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          {/* Formula */}
          <Box
            onClick={() => copyToClipboard(properties.MolecularFormula, 'Formula')}
            sx={{
              flex: 1,
              background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
              border: '2px solid',
              borderColor: '#667eea',
              borderRadius: 3,
              p: 2.5,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.2)',
              }
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#667eea',
                fontWeight: 700,
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'block',
                mb: 1,
              }}
            >
              Formula {copied === 'Formula' && '✓ Copied'}
            </Typography>
            <Typography
              sx={{
                fontFamily: 'monospace',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#667eea',
                lineHeight: 1.2,
              }}
            >
              {properties.MolecularFormula}
            </Typography>
          </Box>

          {/* Molecular Weight */}
          <Box
            onClick={() => copyToClipboard(properties.MolecularWeight.toString(), 'MW')}
            sx={{
              flex: 1,
              background: 'linear-gradient(135deg, #764ba215 0%, #667eea15 100%)',
              border: '2px solid',
              borderColor: '#764ba2',
              borderRadius: 3,
              p: 2.5,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(118, 75, 162, 0.2)',
              }
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#764ba2',
                fontWeight: 700,
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'block',
                mb: 1,
              }}
            >
              Mol. Weight {copied === 'MW' && '✓ Copied'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography
                sx={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#764ba2',
                  lineHeight: 1.2,
                }}
              >
                {properties.MolecularWeight}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: '#764ba2',
                  opacity: 0.7,
                }}
              >
                g/mol
              </Typography>
            </Box>
          </Box>

          {/* Exact Mass */}
          {properties.ExactMass && (
            <Box
              onClick={() => copyToClipboard(properties.ExactMass!.toString(), 'Exact Mass')}
              sx={{
                flex: 1,
                background: 'linear-gradient(135deg, #10b98115 0%, #05966915 100%)',
                border: '2px solid',
                borderColor: '#10b981',
                borderRadius: 3,
                p: 2.5,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
                }
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: '#10b981',
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  display: 'block',
                  mb: 1,
                }}
              >
                Exact Mass {copied === 'Exact Mass' && '✓ Copied'}
              </Typography>
              <Typography
                sx={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#10b981',
                  lineHeight: 1.2,
                }}
              >
                {properties.ExactMass}
              </Typography>
            </Box>
          )}
        </Box>

        {/* IDENTIFIERS SECTION */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 3,
            mb: 2.5,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <SectionHeader 
            icon={<Fingerprint />} 
            title="Molecular Identifiers" 
            sectionKey="identifiers"
            color="#667eea"
            onCopyAll={() => copySection('Molecular Identifiers', {
              InChIKey: properties.InChIKey,
              'Canonical SMILES': properties.CanonicalSMILES,
              InChI: properties.InChI,
            })}
          />
          <Collapse in={expandedSections.has('identifiers')}>
            <Box sx={{ p: 2.5, pt: 0 }}>
              {properties.InChIKey && (
                <Box sx={{ mb: 2.5 }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 700, 
                      fontSize: '0.7rem', 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      mb: 1.5,
                    }}
                  >
                    InChIKey
                  </Typography>
                  <CodeBlock 
                    value={properties.InChIKey}
                    label="InChIKey"
                    onCopy={() => copyToClipboard(properties.InChIKey!, 'InChIKey')}
                  />
                </Box>
              )}

              {properties.CanonicalSMILES && (
                <Box sx={{ mb: 2.5 }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 700, 
                      fontSize: '0.7rem', 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      mb: 1.5,
                    }}
                  >
                    Canonical SMILES
                  </Typography>
                  <CodeBlock 
                    value={properties.CanonicalSMILES}
                    label="SMILES"
                    onCopy={() => copyToClipboard(properties.CanonicalSMILES!, 'SMILES')}
                  />
                </Box>
              )}

              {properties.InChI && (
                <Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 700, 
                      fontSize: '0.7rem', 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      mb: 1.5,
                    }}
                  >
                    InChI
                  </Typography>
                  <CodeBlock 
                    value={properties.InChI}
                    label="InChI"
                    onCopy={() => copyToClipboard(properties.InChI!, 'InChI')}
                  />
                </Box>
              )}
            </Box>
          </Collapse>
        </Box>

        {/* PHYSICOCHEMICAL PROPERTIES */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 3,
            mb: 2.5,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <SectionHeader 
            icon={<Biotech />} 
            title="Physicochemical Properties" 
            sectionKey="physicochemical"
            color="#10b981"
            onCopyAll={() => copySection('Physicochemical Properties', {
              XLogP: properties.XLogP,
              TPSA: properties.TPSA,
              Complexity: properties.Complexity,
              Charge: properties.Charge,
              'Monoisotopic Mass': properties.MonoisotopicMass,
            })}
          />
          <Collapse in={expandedSections.has('physicochemical')}>
            <Box sx={{ p: 2.5, pt: 0 }}>
              {properties.XLogP !== undefined && (
                <DataRow label="XLogP (Lipophilicity)" value={properties.XLogP} />
              )}
              {properties.TPSA !== undefined && (
                <DataRow label="TPSA (Polar Surface Area)" value={properties.TPSA} unit=" Ų" />
              )}
              {properties.Complexity !== undefined && (
                <DataRow label="Complexity" value={properties.Complexity} />
              )}
              {properties.Charge !== undefined && (
                <DataRow label="Formal Charge" value={properties.Charge} />
              )}
              {properties.MonoisotopicMass !== undefined && (
                <DataRow label="Monoisotopic Mass" value={properties.MonoisotopicMass} unit=" Da" />
              )}
            </Box>
          </Collapse>
        </Box>

        {/* MOLECULAR STRUCTURE */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 3,
            mb: 2.5,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <SectionHeader 
            icon={<Category />} 
            title="Molecular Structure" 
            sectionKey="structure"
            color="#f59e0b"
            onCopyAll={() => copySection('Molecular Structure', {
              'H-Bond Donors': properties.HBondDonorCount,
              'H-Bond Acceptors': properties.HBondAcceptorCount,
              'Rotatable Bonds': properties.RotatableBondCount,
              'Heavy Atoms': properties.HeavyAtomCount,
              'Covalent Units': properties.CovalentUnitCount,
            })}
          />
          <Collapse in={expandedSections.has('structure')}>
            <Box sx={{ p: 2.5, pt: 0 }}>
              {properties.HBondDonorCount !== undefined && (
                <DataRow label="H-Bond Donors" value={properties.HBondDonorCount} />
              )}
              {properties.HBondAcceptorCount !== undefined && (
                <DataRow label="H-Bond Acceptors" value={properties.HBondAcceptorCount} />
              )}
              {properties.RotatableBondCount !== undefined && (
                <DataRow label="Rotatable Bonds" value={properties.RotatableBondCount} />
              )}
              {properties.HeavyAtomCount !== undefined && (
                <DataRow label="Heavy Atoms" value={properties.HeavyAtomCount} />
              )}
              {properties.CovalentUnitCount !== undefined && (
                <DataRow label="Covalent Units" value={properties.CovalentUnitCount} />
              )}
            </Box>
          </Collapse>
        </Box>

        {/* 3D PROPERTIES */}
        {(properties.Volume3D || properties.ConformerCount3D) && (
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: 3,
              mb: 2.5,
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <SectionHeader 
              icon={<ThreeDRotation />} 
              title="3D Properties" 
              sectionKey="3d"
              color="#3b82f6"
              onCopyAll={() => copySection('3D Properties', {
                '3D Volume': properties.Volume3D,
                'Conformer Count': properties.ConformerCount3D,
                'Effective Rotors': properties.EffectiveRotorCount3D,
                '3D Features': properties.FeatureCount3D,
              })}
            />
            <Collapse in={expandedSections.has('3d')}>
              <Box sx={{ p: 2.5, pt: 0 }}>
                {properties.Volume3D !== undefined && (
                  <DataRow label="3D Volume" value={properties.Volume3D} unit=" ų" />
                )}
                {properties.ConformerCount3D !== undefined && (
                  <DataRow label="Conformer Count" value={properties.ConformerCount3D} />
                )}
                {properties.EffectiveRotorCount3D !== undefined && (
                  <DataRow label="Effective Rotors" value={properties.EffectiveRotorCount3D} />
                )}
                {properties.FeatureCount3D !== undefined && (
                  <DataRow label="3D Features" value={properties.FeatureCount3D} />
                )}
              </Box>
            </Collapse>
          </Box>
        )}

        {/* SYNONYMS */}
        {summary?.synonyms && summary.synonyms.length > 0 && (
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <SectionHeader 
              icon={<Science />} 
              title="Common Names" 
              sectionKey="synonyms" 
              count={summary.synonyms.length}
              color="#8b5cf6"
              onCopyAll={() => copyToClipboard(summary.synonyms!.slice(0, 20).join(', '), 'Common Names')}
            />
            <Collapse in={expandedSections.has('synonyms')}>
              <Box sx={{ p: 2.5, pt: 0, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {summary.synonyms.slice(0, 20).map((synonym, idx) => (
                  <Chip
                    key={idx}
                    label={synonym}
                    size="small"
                    variant="outlined"
                    onClick={() => copyToClipboard(synonym, synonym)}
                    sx={{
                      fontSize: '0.7rem',
                      height: 28,
                      fontWeight: 500,
                      borderColor: alpha('#8b5cf6', 0.3),
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: alpha('#8b5cf6', 0.1),
                        borderColor: '#8b5cf6',
                      }
                    }}
                  />
                ))}
                {summary.synonyms.length > 20 && (
                  <Chip
                    label={`+${summary.synonyms.length - 20} more`}
                    size="small"
                    sx={{
                      fontSize: '0.7rem',
                      height: 28,
                      fontWeight: 700,
                      bgcolor: alpha('#8b5cf6', 0.15),
                      color: '#8b5cf6',
                    }}
                  />
                )}
              </Box>
            </Collapse>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CompoundInfoCompact;
