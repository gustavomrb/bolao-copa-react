import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { collection, doc, updateDoc, deleteField, Timestamp, addDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { database, sincronizaPrazosBolao } from './firebase';
import { GlobalContext } from './App';
import {
  Box,
  Button,
  Container,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { Edit, Delete, Add, ExpandMore } from '@mui/icons-material';

const initialEquipeState = { nome: '', convocados: [] };

const AdminEquipes = () => {
  const [formData, setFormData] = useState(initialEquipeState);
  const [editando, setEditando] = useState(null);
  const [novoJogador, setNovoJogador] = useState('');
  const [bulkTeams, setBulkTeams] = useState('');
  const [bulkJogadoresText, setBulkJogadoresText] = useState('');
  const { bolaoAtual, selecoesCopa } = useContext(GlobalContext);

  const equipes = selecoesCopa.current.map(e => ({ id: e.id, ...e.data }));

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.nome || !bolaoAtual) return;

    // Apenas os campos 'nome' e 'convocados' serão salvos.
    const equipeData = {
      nome: formData.nome,
      convocados: formData.convocados || [],
    };

    const equipeRef = doc(database, 'equipesBolao', bolaoAtual);

    if (editando) {
      await updateDoc(equipeRef, { [`equipes.${editando.id}`]: equipeData });
    } else {
      const newEquipeId = doc(collection(database, '_')).id;
      // Ao criar, a lista de convocados começa vazia.
      await updateDoc(equipeRef, { [`equipes.${newEquipeId}`]: { nome: formData.nome, convocados: [] } });
    }
    handleCancel();
  };

  const handleBulkAdd = async () => {
    if (!bulkTeams.trim() || !bolaoAtual) return;

    const teamNames = bulkTeams.split('\n').filter(name => name.trim() !== '');
    if (teamNames.length === 0) return;

    const equipeRef = doc(database, 'equipesBolao', bolaoAtual);
    const updates = {};

    teamNames.forEach(name => {
      const newEquipeId = doc(collection(database, '_')).id;
      updates[`equipes.${newEquipeId}`] = { nome: name.trim(), convocados: [] };
    });

    await updateDoc(equipeRef, updates);
    setBulkTeams('');
    alert(`${teamNames.length} equipes adicionadas com sucesso!`);
  };

  const handleEdit = (equipe) => {
    setEditando(equipe);
    setFormData({ nome: equipe.nome, convocados: equipe.convocados || [] });
  };

  const handleDelete = async (id) => {
    if (bolaoAtual) {
      const equipeRef = doc(database, 'equipesBolao', bolaoAtual);
      await updateDoc(equipeRef, { [`equipes.${id}`]: deleteField() });
    }
  };

  const handleCancel = () => {
    setEditando(null);
    setFormData(initialEquipeState);
    setNovoJogador('');
    setBulkTeams('');
    setBulkJogadoresText('');
  };

  const handleAddJogador = () => {
    if (novoJogador.trim() === '') return;
    setFormData(prev => ({
      ...prev,
      convocados: [...(prev.convocados || []), novoJogador.trim()]
    }));
    setNovoJogador('');
  };

  const handleDeleteJogador = (index) => {
    setFormData(prev => ({
      ...prev,
      convocados: prev.convocados.filter((_, i) => i !== index)
    }));
  };

  const handleBulkAddJogadores = () => {
    if (bulkJogadoresText.trim() === '') return;
    const novosJogadores = bulkJogadoresText.split('\n').map(j => j.trim()).filter(j => j);
    if (novosJogadores.length === 0) return;

    setFormData(prev => {
      const existingConvocados = new Set(prev.convocados || []);
      const combined = [...(prev.convocados || []), ...novosJogadores.filter(j => !existingConvocados.has(j))];
      return { ...prev, convocados: combined };
    });
    setBulkJogadoresText('');
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Gerenciamento de Equipes
      </Typography>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nome da Equipe"
              name="nome"
              value={formData.nome}
              onChange={handleFormChange}
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={handleSave}>
              {editando ? 'Atualizar Equipe' : 'Adicionar Nova Equipe'}
            </Button>
            {editando && (
              <Button variant="outlined" onClick={handleCancel} sx={{ ml: 1 }}>
                Cancelar
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />} aria-controls="panel1a-content" id="panel1a-header">
          <Typography>Adicionar em Massa</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Nomes das Equipes (um por linha)"
                value={bulkTeams}
                onChange={(e) => setBulkTeams(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" onClick={handleBulkAdd}>
                Adicionar Times em Massa
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {editando && (
        <>
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Gerenciar Jogadores Convocados
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={9}>
                <TextField
                  fullWidth
                  label="Nome do Jogador"
                  value={novoJogador}
                  onChange={(e) => setNovoJogador(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button fullWidth variant="contained" startIcon={<Add />} onClick={handleAddJogador}>
                  Adicionar
                </Button>
              </Grid>
            </Grid>
            <List sx={{ mt: 2 }}>
              {formData.convocados && formData.convocados.map((jogador, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteJogador(index)}>
                      <Delete />
                    </IconButton>
                  }
                >
                  <ListItemText primary={jogador} />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />} aria-controls="panel2a-content" id="panel2a-header">
              <Typography>Adicionar Jogadores em Massa</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Nomes dos Jogadores (um por linha)"
                    value={bulkJogadoresText}
                    onChange={(e) => setBulkJogadoresText(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" onClick={handleBulkAddJogadores}>
                    Adicionar Jogadores em Massa
                  </Button>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </>
      )}

      <List>
        {equipes.map((equipe) => (
          <ListItem
            key={equipe.id}
            secondaryAction={
              <>
                <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(equipe)}>
                  <Edit />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(equipe.id)} sx={{ ml: 1 }}>
                  <Delete />
                </IconButton>
              </>
            }
          >
            <ListItemText primary={equipe.nome} secondary={`${equipe.convocados?.length || 0} jogadores convocados`} />
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

const initialJogoState = { equipe1: '', equipe2: '', data: '', fase: '', grupo: '', gols1: '', gols2: '' };

const AdminJogos = () => {
  const [fases, setFases] = useState([]);
  const [formData, setFormData] = useState(initialJogoState);
  const [editando, setEditando] = useState(null);
  const [bulkGamesText, setBulkGamesText] = useState('');
  const { bolaoAtual, boloes, jogosCopa, selecoesCopa } = useContext(GlobalContext);

  const jogos = jogosCopa.current.map(j => ({ id: j.id, ...j.data }));
  const equipes = selecoesCopa.current.map(e => ({ id: e.id, ...e.data }));

  useEffect(() => {
    if (bolaoAtual) {
      const currentBolao = boloes.find(b => b.id === bolaoAtual);
      if (currentBolao) {
        setFases(currentBolao.data.fases || []);
      }
    }
  }, [bolaoAtual, boloes]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const { equipe1, equipe2, data, fase, grupo } = formData;
    if (!equipe1 || !equipe2 || !data || !fase || !bolaoAtual) return;

    const [year, month, day] = data.split('T')[0].split('-');
    const [hour, minute] = data.split('T')[1].split(':');
    const date = new Date(year, month - 1, day, hour, minute);
    const timestamp = Timestamp.fromDate(date);

    const jogoData = {
      times: [equipe1, equipe2],
      data: timestamp,
      fase,
      grupo: grupo || null,
      gols1: null,
      gols2: null,
    };

    const jogoRef = doc(database, 'jogosBolao', bolaoAtual);

    let nextJogos;
    if (editando) {
      await updateDoc(jogoRef, { [`jogos.${editando.id}`]: jogoData });
      nextJogos = jogos.map((jogo) => jogo.id === editando.id ? { id: editando.id, ...jogoData } : jogo);
    } else {
      const newJogoId = doc(collection(database, '_')).id;
      await updateDoc(jogoRef, { [`jogos.${newJogoId}`]: jogoData });
      nextJogos = [...jogos, { id: newJogoId, ...jogoData }];
    }
    await sincronizaPrazosBolao(bolaoAtual, nextJogos, fases);

    handleCancel();
  };

  const handleBulkAddJogos = async () => {
    if (!bolaoAtual || !bulkGamesText.trim()) {
        alert("Selecione um bolão e insira os dados dos jogos.");
        return;
    }

    const equipes = selecoesCopa.current.map(e => ({ id: e.id, ...e.data }));
    if (!equipes || equipes.length === 0) {
        alert("Nenhuma equipe encontrada. Carregue as equipes primeiro.");
        return;
    }

    const equipesMap = equipes.reduce((acc, equipe) => {
        acc[equipe.nome.toUpperCase()] = equipe.id;
        return acc;
    }, {});

    const lines = bulkGamesText.trim().split('\n');
    const updates = {};
    let error = false;

    for (const line of lines) {
        if (line.trim() === '') continue;

        const parts = line.split(' - ').map(p => p.trim());
        if (parts.length !== 5) {
            alert(`Linha em formato inválido, pulando: "${line}"`);
            continue;
        }

        const [time1Name, time2Name, dataStr, grupo, faseId] = parts;

        const time1Id = equipesMap[time1Name.toUpperCase()];
        const time2Id = equipesMap[time2Name.toUpperCase()];

        if (!time1Id || !time2Id) {
            alert(`Uma ou ambas as equipes não foram encontradas para a linha: "${line}". Verifique os nomes.`);
            error = true;
            break; 
        }
        
        const dateTimeRegex = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/;
        const match = dataStr.match(dateTimeRegex);

        if (!match) {
            alert(`Formato de data inválido para a linha: "${line}". Use dd/mm/aaaa hh:mm.`);
            error = true;
            break;
        }

        const [, day, month, year, hour, minute] = match;
        const gameDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);

        if (isNaN(gameDate.getTime())) {
            alert(`Data inválida para a linha: "${line}".`);
            error = true;
            break;
        }

        const newJogoId = doc(collection(database, '_')).id;
        updates[`jogos.${newJogoId}`] = {
            times: [time1Id, time2Id],
            data: Timestamp.fromDate(gameDate),
            fase: parseInt(faseId,10),
            grupo: grupo,
            gols1: null,
            gols2: null,
        };
    }

    if (error) {
        console.error("Erro no processamento em massa, operação cancelada.");
        return;
    }

    if (Object.keys(updates).length > 0) {
        try {
            const jogoRef = doc(database, 'jogosBolao', bolaoAtual);
            await updateDoc(jogoRef, updates);
            const novosJogos = Object.entries(updates).map(([path, jogo]) => ({
              id: path.replace('jogos.', ''),
              ...jogo,
            }));
            await sincronizaPrazosBolao(bolaoAtual, [...jogos, ...novosJogos], fases);
            alert('Jogos adicionados com sucesso!');
            setBulkGamesText('');
        } catch (err) {
            console.error("Erro ao adicionar jogos em massa:", err);
            alert("Ocorreu um erro ao adicionar os jogos.");
        }
    }
};

  const handleCancel = () => {
    setFormData(initialJogoState);
    setEditando(null);
    setBulkGamesText('');
  };

  const handleEdit = (jogo) => {
    setEditando(jogo);
    const d = jogo.data.toDate();
    const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    setFormData({
      equipe1: jogo.times[0],
      equipe2: jogo.times[1],
      data: dateString,
      fase: jogo.fase,
      grupo: jogo.grupo || '',
    });
  };

  const handleDelete = async (id) => {
    if (bolaoAtual) {
      const jogoRef = doc(database, 'jogosBolao', bolaoAtual);
      await updateDoc(jogoRef, { [`jogos.${id}`]: deleteField() });
      await sincronizaPrazosBolao(
        bolaoAtual,
        jogos.filter((jogo) => jogo.id !== id),
        fases,
      );
    }
  };

  const getNomeEquipe = (id) => {
    const equipe = equipes.find((e) => e.id === id);
    return equipe ? equipe.nome : 'Desconhecida';
  };

  const getFaseNome = (id) => {
    const faseObj = fases.find((f) => f.id === id);
    return faseObj ? faseObj.nome : id;
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Gerenciamento de Jogos</Typography>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Equipe 1</InputLabel>
              <Select name="equipe1" value={formData.equipe1} label="Equipe 1" onChange={handleFormChange}>
                <MenuItem value=""><em>Selecione a Equipe 1</em></MenuItem>
                {equipes.map((e) => (<MenuItem key={e.id} value={e.id}>{e.nome}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Equipe 2</InputLabel>
              <Select name="equipe2" value={formData.equipe2} label="Equipe 2" onChange={handleFormChange}>
                <MenuItem value=""><em>Selecione a Equipe 2</em></MenuItem>
                {equipes.map((e) => (<MenuItem key={e.id} value={e.id}>{e.nome}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="data"
              type="datetime-local"
              value={formData.data}
              onChange={handleFormChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Fase</InputLabel>
              <Select name="fase" value={formData.fase} label="Fase" onChange={handleFormChange}>
                <MenuItem value="">
                  <em>Selecione a Fase</em>
                </MenuItem>
                {fases.map((f) => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField fullWidth label="Grupo" name="grupo" value={formData.grupo} onChange={handleFormChange} />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={handleSave}>{editando ? 'Atualizar' : 'Adicionar'}</Button>
            {editando && <Button variant="outlined" onClick={handleCancel} sx={{ ml: 1 }}>Cancelar</Button>}
          </Grid>
        </Grid>
      </Paper>
      
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />} aria-controls="panel1a-content" id="panel1a-header">
          <Typography>Adicionar em Massa</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Jogos em Massa"
              multiline
              rows={10}
              variant="outlined"
              fullWidth
              value={bulkGamesText}
              onChange={(e) => setBulkGamesText(e.target.value)}
              placeholder="{nome time 1} - {nome time 2} - dd/mm/aaaa hh:mm - {grupo} - {id da fase}"
              helperText="Use o nome completo da equipe. Um jogo por linha."
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleBulkAddJogos}
            >
              Adicionar Jogos em Massa
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>
      
      <List>
        {jogos.map((jogo) => (
          <ListItem
            key={jogo.id}
            secondaryAction={
              <>
                <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(jogo)}><Edit /></IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(jogo.id)} sx={{ ml: 1 }}><Delete /></IconButton>
              </>
            }
          >
            <ListItemText
              primary={`${getNomeEquipe(jogo.times[0])} vs ${getNomeEquipe(jogo.times[1])}`}
              secondary={`Fase: ${getFaseNome(jogo.fase)} - Grupo: ${jogo.grupo || 'N/A'}`}
            />
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

const initialBolaoState = { nomeTorneio: '', anoTorneio: '', fases: [], faseAtual: '' };

const AdminBoloes = () => {
  const { boloes, jogosCopa, bolaoAtual } = useContext(GlobalContext);
  const [formData, setFormData] = useState(initialBolaoState);
  const [editando, setEditando] = useState(null);
  const [novaFaseNome, setNovaFaseNome] = useState('');
  const [novaFaseId, setNovaFaseId] = useState('');

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const { nomeTorneio, anoTorneio, fases, faseAtual } = formData;
    if (!nomeTorneio || !anoTorneio) return;

    const bolaoData = { 
      nomeTorneio, 
      anoTorneio: anoTorneio, 
      fases: fases || [],
      faseAtual: Number(faseAtual)                                                                                                                      || '' 
    };

    if (editando) {
      await updateDoc(doc(database, 'boloes', editando.id), bolaoData);
      if (editando.id === bolaoAtual) {
        const jogosAtuais = jogosCopa.current.map((jogo) => ({ id: jogo.id, ...jogo.data }));
        await sincronizaPrazosBolao(editando.id, jogosAtuais, fases || []);
      }
    } else {
      const newBolaoRef = await addDoc(collection(database, 'boloes'), { ...bolaoData, fases: [], faseAtual: 1 });
      await setDoc(doc(database, 'equipesBolao', newBolaoRef.id), { equipes: {} });
      await setDoc(doc(database, 'jogosBolao', newBolaoRef.id), { artilheiro: '', campeao: '', jogos: {} });
    }

    handleCancel();
  };

  const handleCancel = () => {
    setFormData(initialBolaoState);
    setEditando(null);
    setNovaFaseNome('');
    setNovaFaseId('');
  }

  const handleEdit = (bolao) => {
    setEditando(bolao);
    setFormData({ 
      nomeTorneio: bolao.data.nomeTorneio, 
      anoTorneio: bolao.data.anoTorneio,
      fases: bolao.data.fases || [],
      faseAtual: bolao.data.faseAtual || ''
    });
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(database, 'boloes', id));
    await deleteDoc(doc(database, 'equipesBolao', id));
    await deleteDoc(doc(database, 'jogosBolao', id));
  };

  const handleAddFase = () => {
    if (novaFaseNome.trim() === '' || novaFaseId.trim() === '') return;
    
    const idExists = formData.fases && formData.fases.some(f => f.id === novaFaseId);
    if (idExists) {
      alert("O ID da fase já existe. Por favor, insira um ID único.");
      return;
    }

    setFormData(prev => ({
      ...prev,
      fases: [...(prev.fases || []), { id: novaFaseId, nome: novaFaseNome.trim() }]
    }));
    setNovaFaseNome('');
    setNovaFaseId('');
  };

  const handleDeleteFase = (id) => {
    setFormData(prev => ({
      ...prev,
      fases: prev.fases.filter(f => f.id !== id)
    }));
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Gerenciamento de Bolões</Typography>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Nome do Torneio" name="nomeTorneio" value={formData.nomeTorneio} onChange={handleFormChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Ano do Torneio" name="anoTorneio" type="number" value={formData.anoTorneio} onChange={handleFormChange} />
          </Grid>
          {editando && (
            <Grid item xs={12}>
                <FormControl fullWidth>
                    <InputLabel>Fase Atual</InputLabel>
                    <Select name="faseAtual" value={formData.faseAtual} label="Fase Atual" onChange={handleFormChange}>
                        <MenuItem value=""><em>Nenhuma</em></MenuItem>
                        {formData.fases.map((f) => (
                            <MenuItem key={f.id} value={f.id}>{f.nome}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>
          )}
          <Grid item xs={12}>
            <Button variant="contained" onClick={handleSave}>{editando ? 'Atualizar Bolão' : 'Adicionar Novo Bolão'}</Button>
            {editando && <Button variant="outlined" onClick={handleCancel} sx={{ ml: 1 }}>Cancelar</Button>}
          </Grid>
        </Grid>
      </Paper>
      
      {editando && (
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h5" gutterBottom>Gerenciar Fases do Bolão</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="ID (Ordem)"
                type="number"
                value={novaFaseId}
                onChange={(e) => setNovaFaseId(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome da Fase"
                value={novaFaseNome}
                onChange={(e) => setNovaFaseNome(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button fullWidth variant="contained" startIcon={<Add />} onClick={handleAddFase}>
                Adicionar
              </Button>
            </Grid>
          </Grid>
          <List sx={{ mt: 2 }}>
            {formData.fases && formData.fases.map((fase) => (
              <ListItem
                key={fase.id}
                secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteFase(fase.id)}>
                    <Delete />
                  </IconButton>
                }
              >
                <ListItemText primary={fase.nome} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <List>
        {boloes.map((bolao) => (
          <ListItem
            key={bolao.id}
            secondaryAction={
              <>
                <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(bolao)}><Edit /></IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(bolao.id)} sx={{ ml: 1 }}><Delete /></IconButton>
              </>
            }
          >
            <ListItemText primary={`${bolao.data.nomeTorneio} - ${bolao.data.anoTorneio}`} secondary={`${bolao.data.fases?.length || 0} fases`} />
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

const Admin = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { isAdmin, adminStatusReady } = useContext(GlobalContext);

  if (!adminStatusReady) return null;
  if (!isAdmin) return <Navigate to="/home" replace />;

  const renderContent = (tabIndex) => {
    switch (tabIndex) {
      case 0:
        return <AdminEquipes />;
      case 1:
        return <AdminJogos />;
      case 2:
        return <AdminBoloes />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h3" component="h1" gutterBottom>
        Página de Administração
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} aria-label="abas de administração">
          <Tab label="Equipes" />
          <Tab label="Jogos" />
          <Tab label="Bolões" />
        </Tabs>
      </Box>
      <Box>
        {renderContent(activeTab)}
      </Box>
    </Container>
  );
};

export default Admin;
