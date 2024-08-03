"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from "@mui/material";
import axios from 'axios'; //axios to make HTTP requests from your frontend.
import CloseIcon from '@mui/icons-material/Close';
import { firestore } from "./firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query } from "firebase/firestore";

export default function Home() {
  const [pantry, setPantry] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openRemoveModal, setOpenRemoveModal] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [itemToRemove, setItemToRemove] = useState("");
  const [newQuantity, setNewQuantity] = useState(0);
  const [removeQuantity, setRemoveQuantity] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchPantryItems = async () => {
      const pantryCollection = collection(firestore, "pantry");
      const pantrySnapshot = await getDocs(pantryCollection);
      const itemsList = pantrySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, quantity: doc.data().quantity || 0 }));
      setPantry(itemsList);
    };
    fetchPantryItems();
  }, []);

  const handleOpenAddModal = () => setOpenAddModal(true);
  const handleCloseAddModal = () => setOpenAddModal(false);

  const handleOpenRemoveModal = () => setOpenRemoveModal(true);
  const handleCloseRemoveModal = () => setOpenRemoveModal(false);

  const handleAddItem = async () => {
    if (newItem.trim() === "" || newQuantity <= 0) return;
    if (pantry.length >= 30) {
      alert("Cannot add more than 30 items.");
      return;
    }
    const existingItem = pantry.find(item => item.name.toLowerCase() === newItem.toLowerCase());
    const pantryCollection = collection(firestore, "pantry");

    if (existingItem) {
      const newTotalQuantity = existingItem.quantity + newQuantity;
      if (newTotalQuantity > 1000) {
        alert(`Cannot add more than ${1000 - existingItem.quantity} to this item.`);
        return;
      }
      await updateDoc(doc(firestore, "pantry", existingItem.id), { quantity: newTotalQuantity });
      setPantry(pantry.map(item => item.id === existingItem.id ? { ...item, quantity: newTotalQuantity } : item));
    } else {
      if (newQuantity > 1000) {
        alert("Cannot add more than 1000 quantity.");
        return;
      }
      const docRef = await addDoc(pantryCollection, { name: newItem, quantity: newQuantity });
      setPantry([...pantry, { id: docRef.id, name: newItem, quantity: newQuantity }]);
    }
    setNewItem("");
    setNewQuantity(0);
    handleCloseAddModal();
  };

  const handleRemoveItem = async () => {
    if (removeQuantity <= 0) return;
    const itemDoc = pantry.find(item => item.name && item.name.toLowerCase() === itemToRemove.toLowerCase());
    if (itemDoc) {
      const newTotalQuantity = itemDoc.quantity - removeQuantity;
      if (newTotalQuantity < 0) {
        alert(`Cannot remove more than ${itemDoc.quantity} from this item.`);
        return;
      }
      if (newTotalQuantity === 0) {
        await deleteDoc(doc(firestore, "pantry", itemDoc.id));
        setPantry(pantry.filter(item => item.id !== itemDoc.id));
      } else {
        await updateDoc(doc(firestore, "pantry", itemDoc.id), { quantity: newTotalQuantity });
        setPantry(pantry.map(item => item.id === itemDoc.id ? { ...item, quantity: newTotalQuantity } : item));
      }
    }
    setItemToRemove("");
    setRemoveQuantity(0);
    handleCloseRemoveModal();
  };

  const handleSearch = () => {
    const item = pantry.find(item => item.name.toLowerCase() === searchQuery.toLowerCase());
    if (item) {
      setSearchResult(`Quantity of ${item.name}: ${item.quantity}`);
    } else {
      setSearchResult("Item not in pantry.");
    }
  };

  const handleGenerateRecipe = async () => {
    if (pantry.length < 5) {
      setErrorMessage("Need at least 5 items to create recipe.");
      return;
    }
    setErrorMessage("");
    const ingredients = pantry.map(item => item.name);
    try {
      const response = await axios.post('http://localhost:5001/generate-recipe', 
        { ingredients },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      setRecipe(response.data.recipe);
    } catch (error) {
      console.error("Error generating recipe:", error.response ? error.response.data : error.message);
      setErrorMessage("Failed to generate recipe. Please try again.");
    }
  };

  const handleCloseRecipe = () => {
    setRecipe(null);
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      bgcolor="background.default"
      p={2}
    >
      <Box
        width="800px"
        height="100px"
        bgcolor="primary.main"
        display="flex"
        justifyContent="center"
        alignItems="center"
        borderRadius="8px"
        boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)"
        mb={2}
      >
        <Typography variant="h3" color="text.primary" textAlign="center" fontWeight="light">
          Inventory Items
        </Typography>
      </Box>
      <Stack
        width="800px"
        height="400px"
        spacing={2}
        overflow="auto"
        border="1px solid #333"
        borderRadius="8px"
        boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)"
        p={2}
        bgcolor="background.paper"
        mb={4}
      >
        {pantry.map((item) => (
          <Box
            key={item.id}
            width="100%"
            minHeight="100px"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            bgcolor="#2e2e2e"
            borderRadius="8px"
            boxShadow="0 2px 4px rgba(0, 0, 0, 0.1)"
            px={2}
          >
            <Typography variant="h5" color="text.primary" textAlign="center" fontWeight="light">
              {item.name ? item.name.charAt(0).toUpperCase() + item.name.slice(1) : "Unnamed Item"}
            </Typography>
            <Typography variant="h6" color="text.primary" textAlign="center" fontWeight="light">
              Quantity: {item.quantity}
            </Typography>
            <Typography variant="h6" color="text.primary" textAlign="center" fontWeight="light">
              Inventory left: {1000 - item.quantity}
            </Typography>
          </Box>
        ))}
      </Stack>

      {/* Search Bar */}
      <Box
        width="800px"
        display="flex"
        flexDirection="column"
        alignItems="center"
        mb={4}
      >
        <TextField
          label="Search Item"
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          sx={{ mb: 2 }}
        >
          Search
        </Button>
        {searchResult && (
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {searchResult}
          </Typography>
        )}
      </Box>

      <Box
        width="800px"
        display="flex"
        justifyContent="space-between"
      >
        <Button
          variant="contained"
          color="primary"
          sx={{ width: '48%', height: '60px' }}
          onClick={handleOpenAddModal}
        >
          Add
        </Button>
        <Button
          variant="contained"
          color="secondary"
          sx={{ width: '48%', height: '60px' }}
          onClick={handleOpenRemoveModal}
        >
          Remove
        </Button>
      </Box>

      <Button
        variant="contained"
        color="success"
        sx={{ width: '100%', height: '60px', mt: 2 }}
        onClick={handleGenerateRecipe}
      >
        Generate Recipe
      </Button>

      {errorMessage && (
        <Typography variant="body1" color="error" textAlign="center" sx={{ mt: 2 }}>
          {errorMessage}
        </Typography>
      )}

      {recipe && (
        <Box
          width="800px"
          bgcolor="background.paper"
          borderRadius="8px"
          boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)"
          p={2}
          mt={4}
          position="relative"
        >
          <IconButton
            aria-label="close"
            onClick={handleCloseRecipe}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'grey.500',
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h4" color="text.primary" textAlign="center" mb={2}>
            Generated Recipe
          </Typography>
          <Typography variant="body1" color="text.primary">
            {recipe}
          </Typography>
        </Box>
      )}

      {/* Add Item Modal */}
      <Dialog open={openAddModal} onClose={handleCloseAddModal}>
        <DialogTitle>Add Item</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Item Name"
            fullWidth
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Quantity"
            type="number"
            fullWidth
            value={newQuantity}
            onChange={(e) => setNewQuantity(Number(e.target.value))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddModal}>Cancel</Button>
          <Button onClick={handleAddItem}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Remove Item Modal */}
      <Dialog open={openRemoveModal} onClose={handleCloseRemoveModal}>
        <DialogTitle>Remove Item</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Item Name"
            fullWidth
            value={itemToRemove}
            onChange={(e) => setItemToRemove(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Quantity"
            type="number"
            fullWidth
            value={removeQuantity}
            onChange={(e) => setRemoveQuantity(Number(e.target.value))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRemoveModal}>Cancel</Button>
          <Button onClick={handleRemoveItem}>Remove</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}