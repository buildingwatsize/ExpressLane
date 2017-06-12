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
-- Table structure for table `EmailTemplates`
--

CREATE TABLE `EmailTemplates` (
  `id` int(255) NOT NULL,
  `Text` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `EmailTemplates`
--

INSERT INTO `EmailTemplates` (`id`, `Text`) VALUES
(1, 'Thank you for your recent application to become a member of UniNet Express Lane Services. We are very much complimented that you would like to use our services.\n<br>\nYour application was received and details were retained in our database. Currently, we are currently process your applications and will let you know with in 7 working days.\n<br>\nWe would appreciate being notified if you wish to cancel your application for any reason.\n<br><br>\nSincerely,\n<br>\n<b>UniNet Express Lane Services Team</b>'),
(2, 'Welcome! Your application to UniNet Express Lane Services has been approved. We are proud to have you as our member.\n<br><br>\n*\n, our vision at the UniNet is to serve research and education in our country.  \n<br>Our research community can make use of high speed network for their work.  \n<br>Our efforts are emphasis on pushing frontier Internet usage as well as next generation applications. \n<br>We constantly strive to provide the highest quality services to our members. If there is any difficulty, please do not hesitate to let us know.\n<br>\nFind your login details below:\n<br><br>Username:*\n<br><br>The entire UniNet team looks forward to a very professional working relationship with you; and we ready to support you in any way possible to serve our member better.\n<br><br>\nSincerely,\n<br>\n<b>UniNet Express Lane Services Team</b>'),
(3, 'We regret that your account is deleted due to some reasons, if you have any questions, please contact administrator.\n<br><br>\nSincerely,\n<br>\n<b>UniNet Express Lane Services Team</b>'),
(4, 'Reset Email Completed\n<br><br>\nSincerely,\n<br>\n<b>UniNet Express Lane Services Team</b>'),
(5, 'Thank you for your recent application to become a member of UniNet Express Lane Services. We are very much complimented that you would like to use our services.\n<br>\nCurrently, your application was not approved for some reason.  Please contact us at expresslane.services@gmail.com for more information.\n<br>I would appreciate being notified if you wish to cancel your application for any reason.\n<br>\nBest regards,\n<br>\nSincerely,\n<br>\n<br>\n<b>UniNet Express Lane Services Team</b>'),
(6, 'You have requested for using our UniNet Express Lane Services.  Your express lane services details are as follows:\n<br>Service ID: \n*\n<br>Source IP:\n*\n<br>Destination IP:\n*\n<br>Start :\n*\n<br>end :\n*\n<br>Please, do not hesitate to contact us if you have any difficulty using our services.\n<br><br>\nSincerely,\n<br>\n<b>UniNet Express Lane Services Team</b>'),
(7, 'Request was cancelled by admin'),
(8, 'You have requested for canceling the request for UniNet Express Lane Services.  The details of the cancel request are as follows:\n<br>Service ID:\n*\n<br>Start:\n*\n<br>end:\n*\n<br>Please, do not hesitate to contact us if you have any difficulty using our services\n<br><br>\nSincerely,\n<br>\n<b>UniNet Express Lane Services Team</b>'),
(9, 'You service has been cancelled by administrator.  The details of the cancel service are as follows:\n<br>Service ID:\n*\n<br>Start:\n*\n<br>end:\n*\n<br>Please, do not hesitate to contact us if you have any difficulty using our services\n<br><br>\nSincerely,\n<br>\n<b>UniNet Express Lane Services Team</b>');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `EmailTemplates`
--
ALTER TABLE `EmailTemplates`
  ADD PRIMARY KEY (`id`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
