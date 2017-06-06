-- phpMyAdmin SQL Dump
-- version 4.5.4.1deb2ubuntu2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Jun 06, 2017 at 02:31 PM
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
-- Table structure for table `access_rest_type`
--

CREATE TABLE `access_rest_type` (
  `aid` int(255) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `access_rest_type`
--

INSERT INTO `access_rest_type` (`aid`, `name`) VALUES
(1, 'Profiles'),
(2, 'Reset Password'),
(3, 'Node Status'),
(4, 'User Services All'),
(5, 'User Services State'),
(6, 'User Services History'),
(7, 'Services Requested'),
(8, 'Services Approved'),
(9, 'Services Activated'),
(10, 'User Request List'),
(11, 'User Request Accept'),
(12, 'User Edit'),
(13, 'User Delete'),
(14, 'User All List'),
(15, 'User Access Logs'),
(16, 'User Sign Up'),
(17, 'Access REST Logs'),
(18, 'Services Add'),
(19, 'Services Edit'),
(20, 'Services Delete');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `access_rest_type`
--
ALTER TABLE `access_rest_type`
  ADD PRIMARY KEY (`aid`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `access_rest_type`
--
ALTER TABLE `access_rest_type`
  MODIFY `aid` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
