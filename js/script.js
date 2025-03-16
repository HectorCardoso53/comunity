// Inicialização do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getFirestore, collection, doc, deleteDoc, updateDoc, getDoc, addDoc, getDocs, query,where } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import {firebaseConfig} from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Verificar se o usuário está logado
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Usuário está logado
    console.log("Usuário logado: ", user.email);
    // Coloque o código principal de manipulação de regiões e comunidades aqui.
    listRegions();
  } else {
    // Usuário não está logado, redireciona para a página de login
    window.location.href = "html/login.html"; // Substitua pela URL da sua página de login
  }
})

async function addRegion(regionName) {
  try {
    // Verifica se o nome da região está vazio
    if (!regionName || regionName.trim() === "") {
      alert("Por favor, preencha o campo Comunidade.");
      return;
    }

    // Referência à coleção "regions"
    const regionsRef = collection(db, "regions");

    // Consulta se já existe uma região com o nome fornecido
    const existingRegionQuery = query(regionsRef, where("name", "==", regionName.trim()));
    const querySnapshot = await getDocs(existingRegionQuery);

    if (!querySnapshot.empty) {
      alert("Essa comunidade já existe.");
      return;
    }

    // Adiciona a nova região
    const docRef = await addDoc(regionsRef, { name: regionName.trim() });
    alert("Comunidade adicionada com sucesso!");
    console.log("Região adicionada com ID: ", docRef.id);

    // Recarrega a lista de regiões
    listRegions();
  } catch (error) {
    console.error("Erro ao adicionar a região: ", error);
    alert("Ocorreu um erro ao adicionar a comunidade. Tente novamente.");
  }
}


// Função para editar a região
function editRegion(regionId, regionName) {
  const newRegionName = prompt("Digite o novo nome do Responsável da familia:", regionName);
  if (newRegionName) {
    // Lógica para atualizar o nome da região no banco de dados
    updateRegionName(regionId, newRegionName); // Verifique se esta função está implementada corretamente
  }
}

// Função para remover a região do banco de dados, incluindo as subcoleções
async function removeRegion(regionId) {
  try {
    const regionRef = doc(db, "regions", regionId);
    const communitiesRef = collection(db, "regions", regionId, "communities");
    
    // Obtém todas as comunidades dentro da região
    const communitiesSnapshot = await getDocs(communitiesRef);
    
    // Para cada comunidade, exclua as pessoas dentro dela
    for (const communityDoc of communitiesSnapshot.docs) {
      const peopleRef = collection(communityDoc.ref, "people");
      const peopleSnapshot = await getDocs(peopleRef);

      // Exclui todas as pessoas dentro da comunidade
      for (const personDoc of peopleSnapshot.docs) {
        await deleteDoc(personDoc.ref);
      }

      // Agora, exclui a comunidade
      await deleteDoc(communityDoc.ref);
    }

    // Agora que todas as subcoleções foram apagadas, podemos deletar a região
    await deleteDoc(regionRef);
    alert("Comunidade e todos os dados associados foram excluídos com sucesso!");

    // Recarrega a lista de regiões
    listRegions();
  } catch (error) {
    console.error("Erro ao excluir a comunidade e seus dados:", error);
    alert("Ocorreu um erro ao excluir a comunidade.");
  }
}

// Função para listar as regiões
async function listRegions() {
  const querySnapshot = await getDocs(collection(db, "regions"));
  const regionList = document.getElementById("regionList");
  regionList.innerHTML = ""; // Limpa a lista antes de adicionar novas regiões

  // Para cada região no banco de dados
  querySnapshot.forEach(async (doc) => {
    const regionId = doc.id;
    const regionName = doc.data().name;

    // Cria o item da lista
    const listItem = document.createElement("li");
    listItem.classList.add("list-group-item", "d-flex", "align-items-center");

    // Cria o nome da região (parte principal do item)
    const regionText = document.createElement("span");
    regionText.textContent = regionName;

    // Chama a função para contar o número de pessoas na comunidade dessa região
    const peopleCount = await getPeopleCount(regionId);

    // Cria o badge para exibir a quantidade de pessoas
    const regionBadge = document.createElement("span");
    regionBadge.classList.add("badge", "bg-orange");
    regionBadge.textContent = peopleCount; // Exibe o número de pessoas

    // Cria o botão de editar com texto
    const editButton = document.createElement("button");
    editButton.classList.add("btn", "btn-edit", "ms-2");

    // Substituindo o ícone FontAwesome por uma imagem
    const editIcon = document.createElement("img");
    editIcon.src = "/images/editar.png"; // Caminho para a imagem de editar
    editIcon.alt = "Editar"; // Texto alternativo
    editIcon.style.width = "25px"; // Ajuste do tamanho da imagem
    editIcon.style.height = "25px"; // Ajuste do tamanho da imagem  

    editButton.appendChild(editIcon);

    editButton.addEventListener("click", (e) => {
      e.stopPropagation(); // Evita que o clique no botão de editar dispare o evento de clique no item da lista
      editRegion(regionId, regionName);
    });

    // Cria o botão de excluir com texto
    const deleteButton = document.createElement("button");
    deleteButton.classList.add("btn", "btn-delete", "ms-2");
   
    const deleteIcon = document.createElement("img");
    deleteIcon.src = "/images/excluir.png"; // Caminho para a imagem de excluir
    deleteIcon.alt = "Excluir"; // Texto alternativo
    deleteIcon.style.width = "25px"; // Ajuste do tamanho da imagem
    deleteIcon.style.height = "25px"; // Ajuste do tamanho da imagem
    
    deleteButton.appendChild(deleteIcon);

    function deleteRegion(regionId, regionName) {
      const confirmDelete = confirm(`Tem certeza que deseja excluir a comunidade "${regionName}"?`);
      if (confirmDelete) {
        removeRegion(regionId);
      }
    }
    
    // Agora podemos adicionar o evento corretamente
    deleteButton.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteRegion(regionId, regionName);
    });
  
    // Adiciona o evento de clique ao item da lista (para visualizar detalhes ou editar)
    listItem.addEventListener("click", () => onRegionClick(regionId, regionName));

    // Monta o item da lista com o nome da região, o badge e os botões
    listItem.appendChild(regionText);
    listItem.appendChild(regionBadge);
    listItem.appendChild(editButton);
    listItem.appendChild(deleteButton);

    // Adiciona o item completo à lista
    regionList.appendChild(listItem);
  });
}

// Função para atualizar o nome da região no banco de dados
async function updateRegionName(regionId, newRegionName) {
  const regionRef = doc(db, "regions", regionId);
  await updateDoc(regionRef, {
    name: newRegionName
  });
  alert(" Comunidade atualizada com sucesso!");
  listRegions(); // Recarrega a lista de regiões
}


// Função para contar o número de pessoas na comunidade
async function getPeopleCount(regionId) {
  // Acessa as comunidades dentro da região
  const communitiesRef = collection(db, "regions", regionId, "communities");
  const communitiesSnapshot = await getDocs(communitiesRef);

  let totalPeopleCount = 0;

  // Para cada comunidade dentro da região
  for (const communityDoc of communitiesSnapshot.docs) {
    // Acessa as pessoas dentro dessa comunidade
    const peopleRef = collection(communityDoc.ref, "people");
    const peopleSnapshot = await getDocs(peopleRef);

    // Conta o número de pessoas nesta comunidade
    totalPeopleCount += peopleSnapshot.size; // Tamanho do snapshot é o número de documentos
  }

  return totalPeopleCount;
}

async function listCommunities(regionId, regionName) {
  const querySnapshot = await getDocs(collection(db, "regions", regionId, "communities"));
  const communityList = document.getElementById("communityList");
  communityList.innerHTML = ""; // Limpa a lista antes de adicionar novas comunidades

  // Atualiza o título com o nome da região selecionada
  document.getElementById("selectedRegion").textContent = `${regionName}`;

  // Para cada comunidade na região
querySnapshot.forEach(async (doc) => {
  const communityId = doc.id;
  const communityName = doc.data().name;

  // Conta o número de pessoas na comunidade
  const peopleCount = await getPeopleCountInCommunity(regionId, communityId);

  // Cria o item da lista com o mesmo estilo das regiões
  const listItem = document.createElement("li");
  listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

  // Nome da comunidade
  const communityText = document.createElement("span");
  communityText.classList.add("text-capitalize");
  communityText.textContent = communityName;

  // Cria o badge para exibir a quantidade de pessoas
  const communityBadge = document.createElement("span");
  communityBadge.classList.add("badge", "bg-orange");
  communityBadge.textContent = peopleCount;
  communityBadge.classList.add("badge-pill", "badge-primary");

  // Cria o botão de editar
  const editButton = document.createElement("button");
  editButton.classList.add("btn", "btn-edit", "ms-2");

  const editIcon = document.createElement("img");
  editIcon.src = "/images/editar.png"; // Caminho para a imagem de editar
  editIcon.alt = "Editar"; // Texto alternativo
  editIcon.style.width = "25px"; // Ajuste do tamanho da imagem
  editIcon.style.height = "25px"; // Ajuste do tamanho da imagem  

  editButton.appendChild(editIcon);

  editButton.addEventListener("click", (e) => {
    e.stopPropagation(); // Evita que o clique no botão de editar dispare o evento de clique na comunidade
    editCommunity(communityId, communityName, regionId, regionName); // Passando regionId e regionName
  });

  // Cria o botão de excluir
  const deleteButton = document.createElement("button");
  deleteButton.classList.add("btn", "btn-delete", "ms-2");

  const deleteIcon = document.createElement("img");
  deleteIcon.src = "/images/excluir.png"; // Caminho para a imagem de excluir
  deleteIcon.alt = "Excluir"; // Texto alternativo
  deleteIcon.style.width = "25px"; // Ajuste do tamanho da imagem
  deleteIcon.style.height = "25px"; // Ajuste do tamanho da imagem

  deleteButton.appendChild(deleteIcon);

  deleteButton.addEventListener("click", (e) => {
    e.stopPropagation(); // Evita que o clique no botão de excluir dispare o evento de clique na comunidade
    deleteCommunity(communityId, regionId, regionName); // Passando regionId e regionName
  });

  // Adiciona o evento de clique ao item da lista para selecionar a comunidade
  listItem.addEventListener("click", (e) => {
    if (e.target.tagName !== "INPUT") { // Verifica se o clique não foi no checkbox
      onCommunityClick(communityId, communityName, regionId);
    }
  });

  // Monta o item da lista
  listItem.appendChild(communityText);
  listItem.appendChild(communityBadge);
  listItem.appendChild(editButton);
  listItem.appendChild(deleteButton);

  // Adiciona o item completo à lista de comunidades
  communityList.appendChild(listItem);
});

}


// Função para editar a comunidade
function editCommunity(communityId, communityName, regionId, regionName) {
  const newCommunityName = prompt("Digite o novo nome da comunidade:", communityName);
  if (newCommunityName) {
    const communityRef = doc(db, "regions", regionId, "communities", communityId);
    updateDoc(communityRef, { name: newCommunityName })
      .then(() => {
        console.log("Comunidade atualizada!");
        listCommunities(regionId, regionName); // Atualiza a lista de comunidades
      })
      .catch((e) => {
        console.error("Erro ao atualizar comunidade: ", e);
      });
  }
}

// Função para excluir a comunidade
function deleteCommunity(communityId, regionId, regionName) {
  if (confirm("Tem certeza que deseja excluir esta comunidade?")) {
    const communityRef = doc(db, "regions", regionId, "communities", communityId);
    deleteDoc(communityRef)
      .then(() => {
        console.log("Comunidade excluída!");
        listCommunities(regionId, regionName); // Atualiza a lista de comunidades
      })
      .catch((e) => {
        console.error("Erro ao excluir comunidade: ", e);
      });
  }
}


// Função para contar o número de pessoas em uma comunidade
async function getPeopleCountInCommunity(regionId, communityId) {
  const peopleSnapshot = await getDocs(collection(db, "regions", regionId, "communities", communityId, "people"));
  return peopleSnapshot.size; // Retorna o número de documentos na subcoleção "people"
}


// Função para adicionar uma nova comunidade
async function addCommunity(regionId) {
  const communityName = prompt("Digite o nome do responsável da familia:");

  // Verifica se o nome da comunidade foi preenchido
  if (!communityName) {
    alert("O nome do responsável é obrigatório.");
    return;
  }

  // Verifica se a comunidade já existe
  const communitiesRef = collection(db, "regions", regionId, "communities");
  const q = query(communitiesRef, where("name", "==", communityName));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    alert("Este á está registrada na região.");
    return;
  }

  try {
    // Adiciona a comunidade se passar nas validações
    await addDoc(communitiesRef, {
      name: communityName,
    });
    console.log("Comunidade adicionada!");
    listCommunities(regionId); // Atualiza a lista de comunidades
  } catch (e) {
    console.error("Erro ao adicionar comunidade: ", e);
  }
}


// Função para quando uma região for clicada
async function onRegionClick(regionId, regionName) {
  document.getElementById("regions").style.display = "none";
  document.getElementById("communities").style.display = "block";

  await listCommunities(regionId, regionName); // Aguarda a lista de comunidades ser carregada

  // Botão para adicionar comunidade
  const btnAddCommunity = document.getElementById("btnAddCommunity");
  btnAddCommunity.onclick = () => addCommunity(regionId);

  // Voltar para a lista de regiões
  const backToRegionsButton = document.getElementById("backToRegions");
  backToRegionsButton.onclick = () => {
    document.getElementById("regions").style.display = "block";
    document.getElementById("communities").style.display = "none";
  };
}

async function addPerson(communityId, regionId) {
  function promptRequired(message) {
    let value = prompt(message);
    if (value === null) {
      alert("Cadastro cancelado.");
      return null; // Retorna null para indicar o cancelamento
    }
    while (!value.trim()) { // Garante que o campo não esteja vazio
      alert("Este campo é obrigatório! Por favor, preencha para continuar.");
      value = prompt(message);
      if (value === null) {
        alert("Cadastro cancelado.");
        return null;
      }
    }
    return value;
  }

  // Solicitação dos dados, cancelando caso qualquer um seja interrompido
  const personName = promptRequired("Digite o nome da pessoa:");
  if (personName === null) return;

  const personID = promptRequired("Digite o CPF da pessoa:");
  if (personID === null) return;

  const personRG = promptRequired("Digite o RG da pessoa:");
  if (personRG === null) return;

  const houseNumber = promptRequired("Digite o número da casa:");
  if (houseNumber === null) return;

  const coordinates = promptRequired("Digite as coordenadas geográficas:");
  if (coordinates === null) return;

  const education = promptRequired("Digite a escolaridade:");
  if (education === null) return;

  const profession = promptRequired("Digite a profissão:");
  if (profession === null) return;

  const age = promptRequired("Digite a idade:");
  if (age === null) return;

  const birthDate = promptRequired("Digite a data de nascimento:");
  if (birthDate === null) return;

  const workCard = promptRequired("Digite o número da carteira de trabalho:");
  if (workCard === null) return;

  const voterId = promptRequired("Digite o título de eleitor:");
  if (voterId === null) return;

  const susCard = promptRequired("Digite o número do cartão SUS:");
  if (susCard === null) return;

  const nis = promptRequired("Digite o NIS:");
  if (nis === null) return;

  const arrivalDate = promptRequired("Digite a data de chegada na comunidade:");
  if (arrivalDate === null) return;

  const mother = promptRequired("Digite o nome da mãe:");
  if (mother === null) return;

  const father = promptRequired("Digite o nome do pai:");
  if (father === null) return;

  const maritalStatus = promptRequired("Digite o estado civil:");
  if (maritalStatus === null) return;

  const association = promptRequired("Digite a associação:");
  if (association === null) return;

  const bolsaFamilia = promptRequired("A pessoa recebe Bolsa Família?");
  if (bolsaFamilia === null) return;

  try {
    await addDoc(collection(db, "regions", regionId, "communities", communityId, "people"), { 
      name: personName,
      cpf: personID,
      rg: personRG,
      houseNumber: houseNumber,
      coordinates: coordinates,
      education: education,
      profession: profession,
      age: age,
      birthDate: birthDate,
      workCard: workCard,
      voterId: voterId,
      susCard: susCard,
      nis: nis,
      arrivalDate: arrivalDate,
      mother: mother,
      father: father,
      maritalStatus: maritalStatus,
      association: association,
      bolsaFamilia: bolsaFamilia
    });

    console.log("Pessoa adicionada!");
    alert("Pessoa cadastrada com sucesso!");
    listPeople(communityId, regionId); // Atualiza a lista de pessoas
  } catch (e) {
    console.error("Erro ao adicionar pessoa: ", e);
    alert("Ocorreu um erro ao cadastrar a pessoa. Tente novamente.");
  }
}


async function editPerson(personId, personData, regionId, communityId) {
  // Abre um formulário para editar os campos
  const newName = prompt("Editar Nome", personData.name);
  if (newName === null) return; // Se o usuário cancelar, sai da função sem fazer alterações

  const newHouseNumber = prompt("Editar Número da Casa", personData.houseNumber);
  if (newHouseNumber === null) return; // Se o usuário cancelar, sai da função sem fazer alterações

  const newCoordinates = prompt("Editar Coordenadas Geográficas", personData.coordinates);
  if (newCoordinates === null) return; // Se o usuário cancelar, sai da função sem fazer alterações

  const newEducation = prompt("Editar Escolaridade", personData.education);
  if (newEducation === null) return; // Se o usuário cancelar, sai da função sem fazer alterações

  const newProfession = prompt("Editar Profissão", personData.profession);
  if (newProfession === null) return; // Se o usuário cancelar, sai da função sem fazer alterações

  const newAge = prompt("Editar Idade", personData.age);
  if (newAge === null) return; // Se o usuário cancelar, sai da função sem fazer alterações

  const newBirthDate = prompt("Editar Data de Nascimento", personData.birthDate);
  if (newBirthDate === null) return; // Se o usuário cancelar, sai da função sem fazer alterações

  const newCpd = prompt("Editar CPF", personData.cpf); // Campo CPF
  if (newCpd === null) return; // Se o usuário cancelar, sai da função sem fazer alterações

  const newRg = prompt("Editar RG", personData.rg); // Campo RG
  if (newRg === null) return; // Se o usuário cancelar, sai da função sem fazer alterações

  const newWorkCard = prompt("Editar Carteira de Trabalho", personData.workCard);
  if (newWorkCard === null) return; // Se o usuário cancelar, sai da função sem fazer alterações

  const newVoterId = prompt("Editar Título de Eleitor", personData.voterId);
  if (newVoterId === null) return; // Se o usuário cancelar, sai da função sem fazer alterações

  const newSusCard = prompt("Editar Cartão SUS", personData.susCard);
  if (newSusCard === null) return; // Se o usuário cancelar, sai da função sem fazer alterações

  const newNis = prompt("Editar NIS", personData.nis);
  if (newNis === null) return; // Se o usuário cancelar, sai da função sem fazer alterações

  const newArrivalDate = prompt("Editar Data de Chegada à Comunidade", personData.arrivalDate);
  if (newArrivalDate === null) return; // Se o usuário cancelar, sai da função sem fazer alterações

  const newMother = prompt("Editar Mãe", personData.mother);
  if (newMother === null) return; // Se o usuário cancelar, sai da função sem fazer alterações

  const newFather = prompt("Editar Pai", personData.father);
  if (newFather === null) return; // Se o usuário cancelar, sai da função sem fazer alterações

  const newMaritalStatus = prompt("Editar Estado Civil", personData.maritalStatus);
  if (newMaritalStatus === null) return; // Se o usuário cancelar, sai da função sem fazer alterações

  const newAssociation = prompt("Editar Associação", personData.association);
  if (newAssociation === null) return; // Se o usuário cancelar, sai da função sem fazer alterações

  const newBolsaFamilia = prompt("Recebe Bolsa Família?", personData.bolsaFamilia);
  if (newBolsaFamilia === null) return; // Se o usuário cancelar, sai da função sem fazer alterações

  // Se o usuário não cancelar, atualiza os dados no Firestore
  try {
    await updateDoc(doc(db, "regions", regionId, "communities", communityId, "people", personId), {
      name: newName,
      houseNumber: newHouseNumber,
      coordinates: newCoordinates,
      education: newEducation,
      profession: newProfession,
      age: newAge,
      birthDate: newBirthDate,
      workCard: newWorkCard,
      voterId: newVoterId,
      susCard: newSusCard,
      nis: newNis,
      arrivalDate: newArrivalDate,
      mother: newMother,
      father: newFather,
      maritalStatus: newMaritalStatus,
      association: newAssociation,
      bolsaFamilia: newBolsaFamilia,
      cpf: newCpd, // Atualizando CPD
      rg: newRg // Atualizando RG
    });
    console.log("Pessoa atualizada!");
    listPeople(communityId, regionId); // Atualiza a lista de pessoas
  } catch (e) {
    console.error("Erro ao atualizar pessoa: ", e);
  }
}


async function listPeople(communityId, regionId) {
  try {
    const querySnapshot = await getDocs(collection(db, "regions", regionId, "communities", communityId, "people"));
    const peopleList = document.getElementById("peopleList");
    peopleList.innerHTML = ""; // Limpa a lista de pessoas

    if (querySnapshot.empty) {
      console.log("Nenhuma pessoa encontrada.");
      return;
    }

    const peopleArray = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    peopleArray.forEach((personData, index) => {
      const personId = personData.id;
      const row = document.createElement("tr");

      const numberCell = document.createElement("td");
      numberCell.textContent = index + 1;
      row.appendChild(numberCell);

      const nameCell = document.createElement("td");
      nameCell.textContent = personData.name || "N/A";
      row.appendChild(nameCell);

      const houseNumberCell = document.createElement("td");
      houseNumberCell.textContent = personData.houseNumber || "N/A";
      row.appendChild(houseNumberCell);

      const coordsCell = document.createElement("td");
      coordsCell.textContent = personData.coordinates || "N/A";
      row.appendChild(coordsCell);

      const educationCell = document.createElement("td");
      educationCell.textContent = personData.education || "N/A";
      row.appendChild(educationCell);

      const professionCell = document.createElement("td");
      professionCell.textContent = personData.profession || "N/A";
      row.appendChild(professionCell);

      const ageCell = document.createElement("td");
      ageCell.textContent = personData.age || "N/A";
      row.appendChild(ageCell);

      const birthDateCell = document.createElement("td");
      birthDateCell.textContent = personData.birthDate || "N/A";
      row.appendChild(birthDateCell);

      const cpfCell = document.createElement("td");
      cpfCell.textContent = personData.cpf || "N/A";
      row.appendChild(cpfCell);

      const rgCell = document.createElement("td");
      rgCell.textContent = personData.rg || "N/A";
      row.appendChild(rgCell);

      const workCardCell = document.createElement("td");
      workCardCell.textContent = personData.workCard || "N/A";
      row.appendChild(workCardCell);

      const voterIdCell = document.createElement("td");
      voterIdCell.textContent = personData.voterId || "N/A";
      row.appendChild(voterIdCell);

      const susCardCell = document.createElement("td");
      susCardCell.textContent = personData.susCard || "N/A";
      row.appendChild(susCardCell);

      const nisCell = document.createElement("td");
      nisCell.textContent = personData.nis || "N/A";
      row.appendChild(nisCell);

      const arrivalDateCell = document.createElement("td");
      arrivalDateCell.textContent = personData.arrivalDate || "N/A";
      row.appendChild(arrivalDateCell);

      const motherCell = document.createElement("td");
      motherCell.textContent = personData.mother || "N/A";
      row.appendChild(motherCell);

      const fatherCell = document.createElement("td");
      fatherCell.textContent = personData.father || "N/A";
      row.appendChild(fatherCell);

      const maritalStatusCell = document.createElement("td");
      maritalStatusCell.textContent = personData.maritalStatus || "N/A";
      row.appendChild(maritalStatusCell);

      const associationCell = document.createElement("td");
      associationCell.textContent = personData.association || "N/A";
      row.appendChild(associationCell);

      const bolsaFamiliaCell = document.createElement("td");
      bolsaFamiliaCell.textContent = personData.bolsaFamilia || "N/A";
      row.appendChild(bolsaFamiliaCell);

      // Botão de Editar
      const editCell = document.createElement("td");
      const editButton = document.createElement("button");
      const editIcon = document.createElement("img");
      editIcon.src = "/images/editar.png";
      editIcon.alt = "Editar";
      editButton.style.border = "none";
      editButton.style.outline = "none";
      editIcon.style.width = "25px";
      editIcon.style.height = "25px";
      editButton.appendChild(editIcon);
      editButton.addEventListener("click", (e) => {
        e.stopPropagation();
        editPerson(personId, personData, regionId, communityId);
      });
      editCell.appendChild(editButton);
      row.appendChild(editCell);

      // Botão de Excluir
      const deleteCell = document.createElement("td");
      const deleteButton = document.createElement("button");
      const deleteIcon = document.createElement("img");
      deleteIcon.src = "/images/excluir.png";
      deleteIcon.alt = "Excluir";
      deleteButton.style.border = "none";
      deleteButton.style.outline = "none";
      deleteIcon.style.width = "25px";
      deleteIcon.style.height = "25px";
      deleteButton.appendChild(deleteIcon);
      deleteButton.addEventListener("click", (e) => {
        e.stopPropagation();
        deletePerson(personId, personData.name, regionId, communityId);
      });
      deleteCell.appendChild(deleteButton);
      row.appendChild(deleteCell);

      peopleList.appendChild(row);
    });
  } catch (error) {
    console.error("Erro ao carregar as pessoas:", error);
  }
}

async function deletePerson(personId, personName, regionId, communityId) {
  const confirmation = confirm(`Você tem certeza que deseja excluir a pessoa ${personName}?`);

  if (confirmation) {
    try {
      const personRef = doc(db, "regions", regionId, "communities", communityId, "people", personId);
      await deleteDoc(personRef);
      alert(`Pessoa ${personName} foi excluída com sucesso!`);
      listPeople(communityId, regionId);
    } catch (error) {
      console.error("Erro ao excluir pessoa:", error);
      alert("Erro ao excluir a pessoa. Tente novamente.");
    }
  }
}



// Espera o DOM carregar completamente
document.addEventListener("DOMContentLoaded", () => {
  const downloadButton = document.getElementById("downloadPdfButton");

  if (downloadButton) {
    downloadButton.addEventListener("click", async () => {
      const ids = await getRealIds(); // Obtém IDs reais do Firestore
      if (!ids) {
        console.error("Não foi possível obter os IDs reais.");
        return;
      }
      
      await downloadPDF(ids.communityId, ids.regionId);
    });
  } else {
    console.error("Botão 'downloadPdfButton' não encontrado!");
  }
});

// Função para obter IDs reais do Firestore
async function getRealIds() {
  try {
    const regionsSnapshot = await getDocs(collection(db, "regions"));
    if (regionsSnapshot.empty) {
      console.error("Nenhuma região encontrada!");
      return null;
    }
    
    const regionDoc = regionsSnapshot.docs[0]; // Pega a primeira região encontrada
    const regionId = regionDoc.id;
    
    const communitiesSnapshot = await getDocs(collection(db, "regions", regionId, "communities"));
    if (communitiesSnapshot.empty) {
      console.error("Nenhuma comunidade encontrada para a região:", regionId);
      return null;
    }
    
    const communityDoc = communitiesSnapshot.docs[0]; // Pega a primeira comunidade encontrada
    const communityId = communityDoc.id;
    
    console.log("IDs reais encontrados:", { communityId, regionId });
    return { communityId, regionId };
  } catch (error) {
    console.error("Erro ao buscar IDs reais:", error);
    return null;
  }
}

async function downloadPDF(communityId, regionId) {
  const { jsPDF } = window.jspdf;
  const pdfDoc = new jsPDF();

  try {
    const communityName = await getCommunityName(communityId, regionId);
    const regionName = await getRegionName(regionId);

    if (!communityName || !regionName) {
      console.error("Não foi possível obter os nomes necessários. PDF não será gerado.");
      return;
    }

    // Obter dados das pessoas
    const peopleSnapshot = await getDocs(collection(db, "regions", regionId, "communities", communityId, "people"));
    const peopleArray = peopleSnapshot.docs.map(doc => doc.data());

    if (peopleArray.length === 0) {
      console.warn("Nenhuma pessoa encontrada nesta comunidade.");
      return;
    }

    const pageHeight = pdfDoc.internal.pageSize.height;
    const marginLeft = 20;
    const lineHeight = 7; // Espaçamento entre linhas
    const maxYPosition = pageHeight - 20; // Margem inferior para evitar corte

    for (let i = 0; i < peopleArray.length; i++) {
      const personData = peopleArray[i];

      if (i > 0) pdfDoc.addPage(); // Nova página para cada pessoa

      // Adicionar logo
      try {
        const logo = await loadImageBase64('/images/ACRQAT.png');
        const pageWidth = pdfDoc.internal.pageSize.width;
        pdfDoc.addImage(logo, 'PNG', (pageWidth - 50) / 2, 10, 50, 50);
      } catch (error) {
        console.warn("A logo não pôde ser carregada, mas o PDF será gerado sem ela.");
      }

      pdfDoc.setFontSize(18);
      pdfDoc.text(`Responsável da Família: ${communityName}`, 20, 70);
      pdfDoc.text(`Comunidade: ${regionName}`, 20, 80);

      pdfDoc.setFontSize(12);
      let yPosition = 100;

      // Função para verificar se a posição y excedeu a altura da página
      function checkPageBreak() {
        if (yPosition > maxYPosition) {
          pdfDoc.addPage();
          yPosition = 20; // Reinicia no topo da nova página
        }
      }

      // Organizar dados em pares chave-valor
      const dataPairs = [
        ["Nome", personData.name],
        ["Número da Casa", personData.houseNumber],
        ["Coordenadas", personData.coordinates],
        ["Escolaridade", personData.education],
        ["Profissão", personData.profession],
        ["Idade", personData.age],
        ["Data de Nascimento", personData.birthDate],
        ["CPF", personData.cpf],
        ["RG", personData.rg],
        ["Carteira de Trabalho", personData.workCard],
        ["Título de Eleitor", personData.voterId],
        ["Cartão SUS", personData.susCard],
        ["NIS", personData.nis],
        ["Data de Chegada", personData.arrivalDate],
        ["Mãe", personData.mother],
        ["Pai", personData.father],
        ["Estado Civil", personData.maritalStatus],
        ["Associação", personData.association],
        ["Bolsa Família", personData.bolsaFamilia]
      ];

      // Dividir a página em duas colunas
      const colWidth = (pdfDoc.internal.pageSize.width - 40) / 2; // Divide a largura da página
      let xPosition1 = marginLeft; // Posição para a primeira coluna
      let xPosition2 = marginLeft + colWidth; // Posição para a segunda coluna

      // Adicionar os dados na tabela de duas colunas
      for (let i = 0; i < dataPairs.length; i++) {
        const [key, value] = dataPairs[i];
        
        // Adicionar chave e valor na primeira e segunda coluna
        pdfDoc.text(`${key}:`, xPosition1, yPosition);
        pdfDoc.text(`${value || "N/A"}`, xPosition2, yPosition);

        yPosition += lineHeight;
        checkPageBreak();
      }
    }

    pdfDoc.save(`Comunidade_${communityName}.pdf`);
  } catch (error) {
    console.error("Erro ao gerar o PDF:", error);
  }
}




// Função auxiliar para carregar imagem como base64
async function loadImageBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Erro ao carregar a imagem.");
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Erro ao carregar imagem:", error);
    throw error;
  }
}

// Função para obter nome da comunidade
async function getCommunityName(communityId, regionId) {
  try {
    console.log(`Buscando nome da comunidade para ID: ${communityId}, Região: ${regionId}`);
    if (!communityId || !regionId) {
      console.error("IDs inválidos!");
      return null;
    }

    const communityDoc = await getDoc(doc(db, "regions", regionId, "communities", communityId));

    if (communityDoc.exists()) {
      console.log("Nome da comunidade encontrado:", communityDoc.data().name);
      return communityDoc.data().name;
    } else {
      console.error(`Comunidade com ID ${communityId} não encontrada!`);
      return null;
    }
  } catch (error) {
    console.error("Erro ao buscar o nome da comunidade:", error);
    return null;
  }
}

// Função para obter nome da região
async function getRegionName(regionId) {
  try {
    console.log(`Buscando nome da região para ID: ${regionId}`);
    if (!regionId) {
      console.error("ID da região inválido!");
      return null;
    }

    const regionDoc = await getDoc(doc(db, "regions", regionId));

    if (regionDoc.exists()) {
      console.log("Nome da região encontrado:", regionDoc.data().name);
      return regionDoc.data().name;
    } else {
      console.error(`Região com ID ${regionId} não encontrada!`);
      return null;
    }
  } catch (error) {
    console.error("Erro ao buscar o nome da região:", error);
    return null;
  }
}


// Função para filtrar pelo nome da pesssoa
document.getElementById("searchInput").addEventListener("input", function () {
  let filter = this.value.toLowerCase();
  let rows = document.querySelectorAll("#peopleList tr");

  rows.forEach(row => {
    let nameCell = row.querySelector("td:nth-child(2)"); // Segunda coluna (Nome)
    if (nameCell) {
      let name = nameCell.textContent.toLowerCase();
      row.style.display = name.includes(filter) ? "" : "none"; // Mostra ou oculta a linha
    }
  });
});


// Função para quando uma comunidade for clicada
async function onCommunityClick(communityId, communityName, regionId) {
  document.getElementById("communities").style.display = "none";
  document.getElementById("people").style.display = "block";

  // Atualiza o nome da comunidade na interface
  document.getElementById("selectedCommunity").textContent = communityName;

  await listPeople(communityId, regionId); // Aguarda a lista de pessoas ser carregada

  document.getElementById("btnAddPerson").addEventListener("click", () => {
    addPerson(communityId, regionId); // Passa o regionId
  });

  document.getElementById("backToCommunities").addEventListener("click", () => {
    document.getElementById("communities").style.display = "block";
    document.getElementById("people").style.display = "none";
  });
}

// Evento para adicionar uma nova região
document.getElementById("btnAddRegion").addEventListener("click", () => {
  const regionName = prompt("Digite o nome da coumidade:");

  // Verifica se o nome da região está vazio
  if (!regionName || regionName.trim() === "") {
    alert("Por favor, preencha o campo Comunidade.");
  } else {
    addRegion(regionName);
  }
});

