-- phpMyAdmin SQL Dump
-- version 4.5.4.1deb2ubuntu2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Jun 06, 2017 at 10:43 AM
-- Server version: 5.7.18-0ubuntu0.16.04.1
-- PHP Version: 7.0.15-0ubuntu0.16.04.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `UniNetExpressLane`
--

-- --------------------------------------------------------

--
-- Table structure for table `org`
--

CREATE TABLE `org` (
  `org` int(50) NOT NULL,
  `nameE` varchar(80) NOT NULL,
  `contractP` varchar(40) NOT NULL,
  `email` varchar(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `org`
--

INSERT INTO `org` (`org`, `nameE`, `contractP`, `email`) VALUES
(1, 'Burapha University', '', ''),
(2, 'Chiang Mai University', '', ''),
(3, 'Chulalongkorn University', '', ''),
(4, 'Kasetsart University', '', ''),
(5, 'Khon Kean University', '', ''),
(6, 'King Mongkut\'s Institute of Technology Ladkrabang', '', ''),
(7, 'King Mongkut\'s University of Technology North Bangkok', '', ''),
(8, 'King Mongkut\'s University of Technology Thonburi', '', ''),
(9, 'Mae Fah Luang University', '', ''),
(10, 'Maejo University', '', ''),
(11, 'Mahasarakham University', '', ''),
(12, 'Mahidol University', '', ''),
(13, 'Nakhon Phanom University', '', ''),
(14, 'Naresuan University', '', ''),
(15, 'Prince of Songkla University', '', ''),
(16, 'Princess of Naradhiwas University', '', ''),
(17, 'Silpakorn University', '', ''),
(18, 'Srinakharinwirot University', '', ''),
(19, 'Suranaree University of Technology', '', ''),
(20, 'Thaksin University', '', ''),
(21, 'Thammasat University', '', ''),
(22, 'Ubon Ratchathani University', '', ''),
(23, 'University of Phayao', '', ''),
(24, 'Walailak University', '', '');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `org`
--
ALTER TABLE `org`
  ADD PRIMARY KEY (`org`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `org`
--
ALTER TABLE `org`
  MODIFY `org` int(50) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
