import React from 'react';
import { Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import NotFound from './pages/NotFound/NotFound';
import HomePage from './pages/HomePage/HomePage';
import LiteracyPage from './pages/LiteracyPage/LiteracyPage';
import PinyinPage from './pages/PinyinPage/PinyinPage';
import PoetryPage from './pages/PoetryPage/PoetryPage';
import EnglishPage from './pages/EnglishPage/EnglishPage';
import MathPage from './pages/MathPage/MathPage';
import SciencePage from './pages/SciencePage/SciencePage';
import CheckinPage from './pages/CheckinPage/CheckinPage';
import ShopPage from './pages/ShopPage/ShopPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';

const RoutesComponent = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="tasks" element={<HomePage />} />
        <Route path="literacy" element={<LiteracyPage />} />
        <Route path="pinyin" element={<PinyinPage />} />
        <Route path="poetry" element={<PoetryPage />} />
        <Route path="english" element={<EnglishPage />} />
        <Route path="math" element={<MathPage />} />
        <Route path="science" element={<SciencePage />} />
        <Route path="checkin" element={<CheckinPage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
