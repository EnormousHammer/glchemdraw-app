/**
 * CollaborationFeatures Component
 * Real-time collaboration, cloud sync, and team workspace features
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Avatar,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Divider,
  Paper,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  People as PeopleIcon,
  CloudSync as CloudSyncIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Comment as CommentIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  MoreVert as MoreIcon,
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  Group as GroupIcon,
  CloudOff as CloudOffIcon,
  CloudQueue as CloudQueueIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';

interface CollaborationFeaturesProps {
  onShareWorkspace?: (workspaceId: string) => void;
  onInviteUser?: (email: string, role: 'viewer' | 'editor') => void;
  onSyncToCloud?: () => void;
  onError?: (error: string) => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
}

interface Workspace {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  owner: User;
  collaborators: User[];
  lastModified: Date;
  version: number;
}

interface Comment {
  id: string;
  author: User;
  content: string;
  timestamp: Date;
  position?: { x: number; y: number };
  resolved: boolean;
}

interface Version {
  id: string;
  number: number;
  author: User;
  timestamp: Date;
  description: string;
  changes: string[];
}

export const CollaborationFeatures: React.FC<CollaborationFeaturesProps> = ({
  onShareWorkspace,
  onInviteUser,
  onSyncToCloud,
  onError,
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('viewer');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Mock data initialization
  useEffect(() => {
    // Simulate loading workspace data
    const mockWorkspace: Workspace = {
      id: 'ws-123',
      name: 'My Chemistry Project',
      description: 'Drug discovery research project',
      isPublic: false,
      owner: {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'owner',
        status: 'online',
      },
      collaborators: [
        {
          id: 'user-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'editor',
          status: 'online',
        },
        {
          id: 'user-3',
          name: 'Bob Wilson',
          email: 'bob@example.com',
          role: 'viewer',
          status: 'away',
        },
      ],
      lastModified: new Date(),
      version: 15,
    };

    const mockComments: Comment[] = [
      {
        id: 'comment-1',
        author: {
          id: 'user-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'editor',
          status: 'online',
        },
        content: 'This structure looks promising for the target receptor',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        position: { x: 100, y: 200 },
        resolved: false,
      },
      {
        id: 'comment-2',
        author: {
          id: 'user-3',
          name: 'Bob Wilson',
          email: 'bob@example.com',
          role: 'viewer',
          status: 'away',
        },
        content: 'Consider adding a methyl group here for better stability',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        position: { x: 150, y: 300 },
        resolved: true,
      },
    ];

    const mockVersions: Version[] = [
      {
        id: 'v-15',
        number: 15,
        author: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'owner',
          status: 'online',
        },
        timestamp: new Date(),
        description: 'Added new reaction pathway',
        changes: ['Added esterification reaction', 'Updated molecular properties'],
      },
      {
        id: 'v-14',
        number: 14,
        author: {
          id: 'user-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'editor',
          status: 'online',
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        description: 'Fixed stereochemistry issues',
        changes: ['Corrected R/S configuration', 'Updated 3D structure'],
      },
    ];

    setWorkspace(mockWorkspace);
    setUsers([mockWorkspace.owner, ...mockWorkspace.collaborators]);
    setComments(mockComments);
    setVersions(mockVersions);
  }, []);

  const handleSyncToCloud = useCallback(async () => {
    setIsSyncing(true);
    try {
      // Simulate cloud sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (onSyncToCloud) {
        onSyncToCloud();
      }
    } catch (err) {
      const errorMessage = (err as Error).message || 'Cloud sync failed';
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [onSyncToCloud, onError]);

  const handleInviteUser = useCallback(async () => {
    if (!inviteEmail.trim()) return;

    try {
      // Simulate user invitation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        status: 'offline',
      };

      setUsers(prev => [...prev, newUser]);
      setInviteEmail('');
      setShowInviteDialog(false);
      
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to invite user';
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [inviteEmail, inviteRole, onError]);

  const handleShareWorkspace = useCallback(() => {
    if (workspace && onShareWorkspace) {
      onShareWorkspace(workspace.id);
    }
    setShowShareDialog(false);
  }, [workspace, onShareWorkspace]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success';
      case 'away': return 'warning';
      case 'offline': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircleIcon />;
      case 'away': return <WarningIcon />;
      case 'offline': return <ErrorIcon />;
      default: return <ErrorIcon />;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PeopleIcon color="primary" />
        Collaboration & Cloud Sync
        <Chip
          icon={isOnline ? <CloudQueueIcon /> : <CloudOffIcon />}
          label={isOnline ? 'Online' : 'Offline'}
          size="small"
          color={isOnline ? 'success' : 'error'}
          variant="outlined"
        />
      </Typography>

      {/* Workspace Info */}
      {workspace && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h6" gutterBottom>
                  {workspace.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {workspace.description}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    label={`Version ${workspace.version}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={workspace.isPublic ? 'Public' : 'Private'}
                    size="small"
                    color={workspace.isPublic ? 'success' : 'default'}
                    variant="outlined"
                  />
                  <Chip
                    label={`${users.length} collaborators`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                </Stack>
              </Box>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <MoreIcon />
              </IconButton>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={handleSyncToCloud}
          disabled={isSyncing || !isOnline}
          startIcon={isSyncing ? <CircularProgress size={16} /> : <CloudSyncIcon />}
        >
          {isSyncing ? 'Syncing...' : 'Sync to Cloud'}
        </Button>
        
        <Button
          variant="outlined"
          onClick={() => setShowInviteDialog(true)}
          startIcon={<PersonAddIcon />}
        >
          Invite User
        </Button>
        
        <Button
          variant="outlined"
          onClick={() => setShowShareDialog(true)}
          startIcon={<ShareIcon />}
        >
          Share Workspace
        </Button>
      </Stack>

      {/* Collaborators */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupIcon />
            Collaborators ({users.length})
          </Typography>
          <List>
            {users.map((user, index) => (
              <ListItem key={user.id} divider={index < users.length - 1}>
                <ListItemIcon>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <Avatar sx={{ width: 12, height: 12, bgcolor: getStatusColor(user.status) + '.main' }}>
                        {getStatusIcon(user.status)}
                      </Avatar>
                    }
                  >
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {user.name.charAt(0)}
                    </Avatar>
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={user.name}
                  secondary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                      <Chip
                        label={user.role}
                        size="small"
                        color={user.role === 'owner' ? 'primary' : user.role === 'editor' ? 'secondary' : 'default'}
                        variant="outlined"
                      />
                      <Chip
                        label={user.status}
                        size="small"
                        color={getStatusColor(user.status) as any}
                        variant="outlined"
                      />
                    </Stack>
                  }
                />
                <IconButton size="small">
                  <CommentIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CommentIcon />
            Comments ({comments.length})
          </Typography>
          <List>
            {comments.map((comment, index) => (
              <ListItem key={comment.id} divider={index < comments.length - 1}>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                    {comment.author.name.charAt(0)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2">
                        {comment.author.name}
                      </Typography>
                      <Chip
                        label={comment.resolved ? 'Resolved' : 'Open'}
                        size="small"
                        color={comment.resolved ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </Stack>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {comment.content}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {comment.timestamp.toLocaleString()}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Version History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            Version History ({versions.length})
          </Typography>
          <Stack spacing={1}>
            {versions.map((version) => (
              <Accordion key={version.id}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                    <Typography variant="subtitle1">
                      Version {version.number}
                    </Typography>
                    <Chip
                      label={version.author.name}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {version.timestamp.toLocaleString()}
                    </Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Description:</strong> {version.description}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Changes:</strong>
                    </Typography>
                    <List dense>
                      {version.changes.map((change, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircleIcon fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText primary={change} />
                        </ListItem>
                      ))}
                    </List>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Invite User Dialog */}
      <Dialog open={showInviteDialog} onClose={() => setShowInviteDialog(false)}>
        <DialogTitle>Invite User to Workspace</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Email Address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteRole}
                onChange={(e: any) => setInviteRole(e.target.value as 'viewer' | 'editor')}
                label="Role"
              >
                <MenuItem value="viewer">Viewer (Read-only)</MenuItem>
                <MenuItem value="editor">Editor (Can edit)</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInviteDialog(false)}>Cancel</Button>
          <Button onClick={handleInviteUser} variant="contained">
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Workspace Dialog */}
      <Dialog open={showShareDialog} onClose={() => setShowShareDialog(false)}>
        <DialogTitle>Share Workspace</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Workspace Link"
              value={workspace ? `https://glchemdraw.com/workspace/${workspace.id}` : ''}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <IconButton onClick={() => navigator.clipboard.writeText(workspace?.id || '')}>
                    <ContentCopyIcon />
                  </IconButton>
                ),
              }}
            />
            <FormControlLabel
              control={<Switch checked={workspace?.isPublic || false} />}
              label="Make workspace public"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowShareDialog(false)}>Cancel</Button>
          <Button onClick={handleShareWorkspace} variant="contained">
            Share
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          <SettingsIcon sx={{ mr: 1 }} />
          Workspace Settings
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <DownloadIcon sx={{ mr: 1 }} />
          Export Workspace
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <UploadIcon sx={{ mr: 1 }} />
          Import Workspace
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CollaborationFeatures;
